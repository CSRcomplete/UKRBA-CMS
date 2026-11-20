/**
 * Assigns all unassigned "Pledge" leads to Matthew.
 *
 * DRY RUN by default: prints what would happen and writes nothing.
 *   npx tsx scripts/assign-pledges-to-matthew.ts
 *   npx tsx scripts/assign-pledges-to-matthew.ts --apply
 *
 * - Only non-deleted Pledge leads with no current owner are touched.
 * - Each assignment is written to the ownership history.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const APPLY = process.argv.includes("--apply");

async function main() {
  const { prismadb } = await import("../lib/prisma");
  const { logOwnershipChange } = await import("../lib/ownership");

  const candidates = await prismadb.users.findMany({
    where: { name: { startsWith: "Matt", mode: "insensitive" } },
    select: { id: true, name: true, role: true, email: true },
  });
  console.log("Users matching 'Matt':");
  candidates.forEach((u) => console.log(`  ${u.name} (${u.role}) ${u.email}`));
  if (candidates.length !== 1) throw new Error(`Expected exactly 1 match, got ${candidates.length}`);
  const matt = candidates[0];

  const type = await prismadb.crm_Lead_Types.findUnique({ where: { name: "Pledge" } });
  if (!type) throw new Error('No "Pledge" lead type found');

  const leads = await prismadb.crm_Leads.findMany({
    where: { lead_type_id: type.id, deletedAt: null, assigned_to: null },
    select: { id: true, firstName: true, lastName: true, company: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`${leads.length} unassigned pledges -> ${matt.name}`);

  for (const lead of leads) {
    if (APPLY) {
      // Same attribution as updateLead: an RD owner is also the lead's Regional Director.
      const regionalDirectorId = matt.role === "regional_director" ? matt.id : null;
      await prismadb.crm_Leads.update({
        where: { id: lead.id },
        data: { assigned_to: matt.id, assigned_regional_director_id: regionalDirectorId },
      });
      await logOwnershipChange({
        entityType: "lead",
        entityId: lead.id,
        previousOwnerId: null,
        newOwnerId: matt.id,
        areaDirectorId: null,
        regionalDirectorId,
        changedById: null,
        changeReason: "Bulk assignment of unassigned pledges to Matthew",
      });
    }
  }
  console.log(APPLY ? `Assigned ${leads.length}.` : "Dry run only. Re-run with --apply to write.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
