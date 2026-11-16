/**
 * Imports a prospect list (rows.json, converted from "Leads Kevin.xlsx") as CRM
 * leads, split evenly between two users (round-robin).
 *
 * DRY RUN by default: prints what would happen and writes nothing.
 *   npx tsx scripts/import-leads-xlsx.ts <rows.json> Pete Shirley
 *   npx tsx scripts/import-leads-xlsx.ts <rows.json> Pete Shirley --apply
 *
 * - Users are found by first name (case-insensitive, startsWith); aborts unless
 *   each name matches exactly one user.
 * - Leads whose email already exists (not deleted) are skipped, never overwritten.
 * - Uses whatever DATABASE_URL is in .env (or the environment) — check it first.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const [file, ...rest] = process.argv.slice(2);
const names = rest.filter((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");
const CAMPAIGN = "Kevin Leads";
const LEAD_TYPE = "Kevin Lead"; // the Kevin Leads tab lists leads of this type

async function main() {
  if (!file || false) throw new Error("Usage: <rows.json> [name1 [name2]] [--apply]");
  const { prismadb } = await import("../lib/prisma");

  const owners: { id: string; name: string | null }[] = [];
  for (const n of names) {
    const m = await prismadb.users.findMany({
      where: { name: { startsWith: n, mode: "insensitive" } },
      select: { id: true, name: true, email: true, role: true },
    });
    if (m.length !== 1) {
      console.error(`"${n}" matched ${m.length} users:`, m);
      process.exit(1);
    }
    console.log(`${n} -> ${m[0].name} <${m[0].email}> (${m[0].role})`);
    owners.push(m[0]);
  }

  // Columns of Kevin_Merged_Contacts.xlsx, looked up by header name.
  const all: string[][] = JSON.parse(fs.readFileSync(file, "utf8"));
  const col = (h: string) => all[0].findIndex((x) => x.trim().toLowerCase() === h.toLowerCase());
  const rows = all.slice(1);
  const clean = (v?: string) => (v || "").trim() || null;
  const pick = (r: string[], h: string) => clean(r[col(h)]);
  const emailOf = (r: string[]) => {
    const e = pick(r, "Work Email") || pick(r, "Personal Email");
    return e && e.includes("@") ? e.toLowerCase() : null;
  };
  const leads = rows.map((r) => ({
    firstName: pick(r, "First Name"),
    lastName: pick(r, "Last Name") || "Lead",
    jobTitle: pick(r, "Job Title"),
    company: pick(r, "Company"),
    email: emailOf(r),
    website: pick(r, "Website"),
    phone: pick(r, "Phone"),
    description: clean(
      [
        pick(r, "Industries") && `Industry: ${pick(r, "Industries")}`,
        pick(r, "Seniority") && `Seniority: ${pick(r, "Seniority")}`,
        pick(r, "# Employees") && `Employees: ${pick(r, "# Employees")}`,
        pick(r, "Annual Revenue") && `Annual revenue: ${pick(r, "Annual Revenue")}`,
        pick(r, "Person Address") && `Person location: ${pick(r, "Person Address")}`,
        pick(r, "Company Address") && `Company address: ${pick(r, "Company Address")}`,
        pick(r, "Company Email") && pick(r, "Company Email") !== "[]" && `Company email: ${pick(r, "Company Email")}`,
        pick(r, "Personal Email") && `Personal email: ${pick(r, "Personal Email")}`,
        pick(r, "Personal LinkedIn") && `LinkedIn: ${pick(r, "Personal LinkedIn")}`,
        pick(r, "Company LinkedIn") && `Company LinkedIn: ${pick(r, "Company LinkedIn")}`,
        pick(r, "Profile Summary") && `\nProfile: ${pick(r, "Profile Summary")}`,
        pick(r, "Company Summary") && `\nCompany: ${pick(r, "Company Summary")}`,
      ]
        .filter(Boolean)
        .join("\n")
    ),
  }));

  const existing = await prismadb.crm_Leads.findMany({
    where: { deletedAt: null, email: { in: leads.map((l) => l.email!).filter(Boolean), mode: "insensitive" } },
    select: { email: true },
  });
  const have = new Set(existing.map((e) => e.email!.toLowerCase()));
  const fresh = leads.filter((l) => !(l.email && have.has(l.email)));
  console.log(`${leads.length} rows, ${leads.length - fresh.length} already in CRM (skipped), ${fresh.length} to create`);

  const now = new Date();
  const data = fresh.map((l, i) => ({
    ...l,
    v: 0,
    createdAt: now,
    updatedAt: now,
    campaign: CAMPAIGN,
    assigned_to: owners.length ? owners[i % owners.length].id : null,
  }));
  owners.forEach((o, i) => console.log(`  ${o.name}: ${data.filter((_, j) => j % owners.length === i).length}`));

  if (!APPLY) return console.log("Dry run only. Re-run with --apply to write.");
  const type =
    (await prismadb.crm_Lead_Types.findUnique({ where: { name: LEAD_TYPE } })) ??
    (await prismadb.crm_Lead_Types.create({ data: { v: 0, name: LEAD_TYPE } }));
  const res = await prismadb.crm_Leads.createMany({
    data: data.map((d) => ({ ...d, lead_type_id: type.id })),
  });
  console.log(`Created ${res.count} leads.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
