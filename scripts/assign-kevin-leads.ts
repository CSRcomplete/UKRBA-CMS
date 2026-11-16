/**
 * Assigns unassigned "Kevin Lead" leads to their Regional / Area Directors by
 * postcode, using the same routeByPostcode() the Wix leads webhook uses
 * (so round-robin between directors sharing a postcode area works the same).
 *
 * DRY RUN by default: prints what would happen and writes nothing.
 *   npx tsx scripts/assign-kevin-leads.ts
 *   npx tsx scripts/assign-kevin-leads.ts --apply
 *
 * - Only leads with no current owner are touched.
 * - Leads with no postcode, no routing rule, or no director on the rule are left
 *   unassigned and listed, never given to a fallback owner.
 * - Each assignment is written to the ownership history.
 * - Dry run note: round-robin balances on already-assigned counts, which don't
 *   change in a dry run, so shared areas (e.g. Scotland) show one director.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const APPLY = process.argv.includes("--apply");

async function main() {
  const { prismadb } = await import("../lib/prisma");
  const { routeByPostcode } = await import("../lib/postcode-routing");
  const { logOwnershipChange } = await import("../lib/ownership");
  const { extractPostcodeArea } = await import("../lib/postcode");

  const type = await prismadb.crm_Lead_Types.findUnique({ where: { name: "Kevin Lead" } });
  if (!type) throw new Error('No "Kevin Lead" lead type found');

  const leads = await prismadb.crm_Leads.findMany({
    where: { lead_type_id: type.id, deletedAt: null, assigned_to: null },
    select: { id: true, firstName: true, lastName: true, postcode: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`${leads.length} unassigned Kevin leads`);

  const names = new Map<string, string>();
  const nameOf = async (id: string) => {
    if (!names.has(id)) {
      const u = await prismadb.users.findUnique({ where: { id }, select: { name: true, role: true } });
      names.set(id, u ? `${u.name} (${u.role})` : id);
    }
    return names.get(id)!;
  };

  const findRd = async (first: string) => {
    const m = await prismadb.users.findMany({
      where: { role: "regional_director", name: { startsWith: first, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (m.length !== 1) throw new Error(`"${first}" matched ${m.length} regional directors`);
    return m[0];
  };
  const matt = await findRd("Matt");
  const joe = await findRd("Joseph");
  const JOE_AREAS = ["B", "CV", "DY", "WS", "WV", "CF", "LL", "NP", "SA", "LD"];
  const NO_FALLBACK = [
    "BT",
    "AB", "DD", "DG", "EH", "FK", "G", "HS", "IV", "KA", "KW", "KY", "ML", "PA", "PH", "TD", "ZE",
  ];
  let fallbackCount = 0;

  const tally = new Map<string, number>();
  const unrouted: string[] = [];

  for (const lead of leads) {
    const label = `${lead.firstName ?? ""} ${lead.lastName} [${lead.postcode ?? "no postcode"}]`;
    if (!lead.postcode) {
      unrouted.push(label);
      continue;
    }
    let r = await routeByPostcode(lead.postcode, null);
    if (!r.ownerId) {
      // Routing table has no director for this area: use the same regional policy as
      // scripts/set-rd-routing.ts (West Midlands + Wales -> Joe, rest of England -> Matt;
      // N. Ireland and Scotland are left unassigned here).
      const area = extractPostcodeArea(lead.postcode);
      const rdId = NO_FALLBACK.includes(area)
        ? null
        : JOE_AREAS.includes(area)
          ? joe.id
          : matt.id;
      if (!rdId) {
        unrouted.push(label);
        continue;
      }
      fallbackCount++;
      r = { ownerId: rdId, areaDirectorId: null, regionalDirectorId: rdId };
    }
    const ownerId = r.ownerId as string;
    tally.set(ownerId, (tally.get(ownerId) ?? 0) + 1);
    if (APPLY) {
      await prismadb.crm_Leads.update({
        where: { id: lead.id },
        data: {
          assigned_to: ownerId,
          assigned_area_director_id: r.areaDirectorId,
          assigned_regional_director_id: r.regionalDirectorId,
        },
      });
      await logOwnershipChange({
        entityType: "lead",
        entityId: lead.id,
        previousOwnerId: null,
        newOwnerId: ownerId,
        areaDirectorId: r.areaDirectorId,
        regionalDirectorId: r.regionalDirectorId,
        changedById: null,
        changeReason: `Kevin Leads postcode assignment - Postcode: ${lead.postcode}`,
      });
    }
  }

  console.log(APPLY ? "Assigned:" : "Would assign:");
  for (const [id, n] of Array.from(tally)) console.log(`  ${await nameOf(id)}: ${n}`);
  console.log(`(${fallbackCount} of those used the regional fallback, not a routing rule)`);
  console.log(`Left unassigned: ${unrouted.length}`);
  unrouted.slice(0, 30).forEach((l) => console.log(`  - ${l}`));
  if (!APPLY) console.log("Dry run only. Re-run with --apply to write.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
