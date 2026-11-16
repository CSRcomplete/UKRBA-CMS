/**
 * Re-points postcode routing at the current four Regional Directors.
 *
 *   Matt            -> all of England except the West Midlands
 *   Joe             -> West Midlands (B CV DY WS WV) + Wales
 *   Tanya + Jasmine -> Scotland (round-robin between the two)
 *   BT (N. Ireland) -> left untouched (no owner decided)
 *
 * DRY RUN by default: prints what would change and writes nothing.
 *   npx tsx scripts/set-rd-routing.ts
 *   npx tsx scripts/set-rd-routing.ts --apply
 *   npx tsx scripts/set-rd-routing.ts --apply --clear-area-directors
 *
 * --clear-area-directors also removes Area Director links on the rules it
 * touches. Needed if any old Area Directors are still linked, because an Area
 * Director link takes priority over the Regional Director in routeByPostcode.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const WEST_MIDLANDS = ["B", "CV", "DY", "WS", "WV"];
const WALES = ["CF", "LL", "NP", "SA", "LD"];
const SCOTLAND = [
  "AB", "DD", "DG", "EH", "FK", "G", "HS", "IV", "KA", "KW", "KY", "ML", "PA", "PH", "TD", "ZE",
];
const LEFT_UNTOUCHED = ["BT"];

const APPLY = process.argv.includes("--apply");
const CLEAR_ADS = process.argv.includes("--clear-area-directors");

async function main() {
  const { prismadb } = await import("../lib/prisma");

  async function findRd(first: string) {
    const matches = await prismadb.users.findMany({
      where: {
        role: "regional_director",
        name: { startsWith: first, mode: "insensitive" },
      },
      select: { id: true, name: true, email: true, userStatus: true },
    });
    if (matches.length !== 1) {
      console.error(
        `Expected exactly one regional_director named "${first}*", found ${matches.length}:`,
        matches
      );
      process.exit(1);
    }
    return matches[0];
  }

  const [matt, joe, tanya, jasmine] = await Promise.all(
    ["Matt", "Joe", "Tanya", "Jasmine"].map(findRd)
  );
  console.log("RDs:", [matt, joe, tanya, jasmine].map((u) => `${u.name} <${u.email}>`).join(" | "));

  const rules = await prismadb.nextcrm_postcode_routing.findMany({
    include: { area_directors: true, regional_directors: true },
    orderBy: { postcode_area: "asc" },
  });

  const plan = rules
    .filter((r) => !LEFT_UNTOUCHED.includes(r.postcode_area))
    .map((r) => {
      const a = r.postcode_area;
      let rds = [matt.id];
      let label = "England (Matt)";
      if (SCOTLAND.includes(a)) {
        rds = [tanya.id, jasmine.id];
        label = "Scotland (Tanya + Jasmine)";
      } else if (WALES.includes(a)) {
        rds = [joe.id];
        label = "Wales (Joe)";
      } else if (WEST_MIDLANDS.includes(a)) {
        rds = [joe.id];
        label = "West Midlands (Joe)";
      }
      return { rule: r, rds, label };
    });

  const withAds = plan.filter((p) => p.rule.area_directors.length > 0).length;
  const counts = new Map<string, number>();
  plan.forEach((p) => counts.set(p.label, (counts.get(p.label) || 0) + 1));
  console.log(`\n${rules.length} rules in DB; ${plan.length} will be re-pointed:`);
  counts.forEach((n, l) => console.log(`  ${l}: ${n}`));
  console.log(`  BT left untouched: ${rules.length - plan.length}`);
  console.log(
    `\n${withAds} of those rules still have Area Director links` +
      (withAds && !CLEAR_ADS
        ? " (they will KEEP overriding the RD unless you pass --clear-area-directors)"
        : "")
  );

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    await prismadb.$disconnect();
    return;
  }

  await prismadb.$transaction(async (tx) => {
    for (const { rule, rds } of plan) {
      await tx.postcodeRoutingToRegionalDirectors.deleteMany({
        where: { postcode_routing_id: rule.id },
      });
      await tx.postcodeRoutingToRegionalDirectors.createMany({
        data: rds.map((id) => ({ postcode_routing_id: rule.id, regional_director_id: id })),
      });
      if (CLEAR_ADS) {
        await tx.postcodeRoutingToAreaDirectors.deleteMany({
          where: { postcode_routing_id: rule.id },
        });
      }
    }
  });
  console.log(`\nApplied to ${plan.length} rules.`);
  await prismadb.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
