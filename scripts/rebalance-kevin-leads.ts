/**
 * Splits all "Kevin Lead" leads evenly between the active Regional Directors,
 * regardless of postcode (e.g. 200 leads / 4 RDs = 50 each).
 *
 * DRY RUN by default: prints the plan and writes nothing.
 *   npx tsx scripts/rebalance-kevin-leads.ts Matthew Joseph Tanya Yjasmine
 *   npx tsx scripts/rebalance-kevin-leads.ts Matthew Joseph Tanya Yjasmine --apply
 *
 * - Moves as few leads as possible: each RD keeps up to their share of the leads
 *   they already own (leads someone has already worked - a status or sales
 *   status set - are kept first); the rest are dealt out to RDs below their share.
 * - The Regional Directors are passed by first name, e.g. Matthew Joseph Tanya Yjasmine.
 * - Every change is written to the ownership history.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const APPLY = process.argv.includes("--apply");
const NAMES = process.argv.slice(2).filter((a) => !a.startsWith("--"));

async function main() {
  if (NAMES.length < 2) throw new Error("Usage: <first name> <first name> ... [--apply]");
  const { prismadb } = await import("../lib/prisma");
  const { logOwnershipChange } = await import("../lib/ownership");

  // The Regional Directors to split between, given by first name (each must match exactly one).
  const rds: { id: string; name: string | null }[] = [];
  for (const n of NAMES) {
    const m = await prismadb.users.findMany({
      where: { role: "regional_director", userStatus: 'ACTIVE', name: { startsWith: n, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
    if (m.length !== 1) {
      console.error(n + " matched " + m.length + " active Regional Directors (need exactly 1). Aborting.");
      process.exit(1);
    }
    rds.push(m[0]);
  }
  console.log("Splitting between:", rds.map((r) => r.name).join(', '));

  const type = await prismadb.crm_Lead_Types.findUnique({ where: { name: "Kevin Lead" } });
  if (!type) throw new Error('No "Kevin Lead" lead type found');

  const leads = await prismadb.crm_Leads.findMany({
    where: { lead_type_id: type.id, deletedAt: null },
    select: { id: true, assigned_to: true, lead_status_id: true, sales_status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const total = leads.length;
  const base = Math.floor(total / rds.length);
  const extra = total % rds.length; // first `extra` RDs (by name) get one more
  const share = new Map(rds.map((r, i) => [r.id, base + (i < extra ? 1 : 0)]));
  console.log(`${total} leads, shares:`, rds.map((r) => `${r.name}=${share.get(r.id)}`).join(", "));

  const worked = (l: (typeof leads)[number]) => !!l.lead_status_id || !!l.sales_status;
  console.log(`Leads already worked (status set): ${leads.filter(worked).length}`);

  // Keep up to `share` of each RD's current leads (worked ones first), pool the rest.
  const keep = new Map<string, string[]>(rds.map((r) => [r.id, []]));
  const pool: (typeof leads)[number][] = [];
  for (const r of rds) {
    const mine = leads
      .filter((l) => l.assigned_to === r.id)
      .sort((a, b) => Number(worked(b)) - Number(worked(a)));
    const k = share.get(r.id)!;
    keep.get(r.id)!.push(...mine.slice(0, k).map((l) => l.id));
    pool.push(...mine.slice(k));
  }
  pool.push(...leads.filter((l) => !rds.some((r) => r.id === l.assigned_to)));

  const moves: { leadId: string; from: string | null; to: string }[] = [];
  for (const r of rds) {
    const need = share.get(r.id)! - keep.get(r.id)!.length;
    for (let i = 0; i < need; i++) {
      const lead = pool.shift();
      if (!lead) break;
      moves.push({ leadId: lead.id, from: lead.assigned_to, to: r.id });
    }
  }
  if (pool.length) throw new Error(`${pool.length} leads left over - plan is wrong`);

  const nameOf = (id: string | null) => rds.find((r) => r.id === id)?.name ?? "(unassigned)";
  for (const r of rds) {
    const received = moves.filter((m) => m.to === r.id).length;
    const lost = leads.filter((l) => l.assigned_to === r.id).length - keep.get(r.id)!.length;
    console.log(`  ${r.name}: keeps ${keep.get(r.id)!.length}, receives ${received}, gives away ${lost} -> ${share.get(r.id)}`);
  }
  console.log(`${moves.length} leads change owner`);

  if (!APPLY) return console.log("Dry run only. Re-run with --apply to write.");

  for (const m of moves) {
    await prismadb.crm_Leads.update({
      where: { id: m.leadId },
      data: { assigned_to: m.to, assigned_regional_director_id: m.to, assigned_area_director_id: null },
    });
    await logOwnershipChange({
      entityType: "lead",
      entityId: m.leadId,
      previousOwnerId: m.from,
      newOwnerId: m.to,
      areaDirectorId: null,
      regionalDirectorId: m.to,
      changedById: null,
      changeReason: "Kevin Leads fair split (even number per Regional Director, regardless of postcode)",
    });
  }
  console.log(`Applied ${moves.length} reassignments.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
