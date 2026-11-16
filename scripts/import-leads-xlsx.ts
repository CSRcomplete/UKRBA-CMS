/**
 * Imports Kevin's merged contact list (rows.json, converted from
 * Kevin_Merged_Contacts_with_Postcodes.xlsx) as CRM leads of type "Kevin Lead".
 *
 * DRY RUN by default: prints what would happen and writes nothing.
 *   npx tsx scripts/import-leads-xlsx.ts <rows.json>                 # unassigned
 *   npx tsx scripts/import-leads-xlsx.ts <rows.json> Pete Shirley    # split round-robin
 *   npx tsx scripts/import-leads-xlsx.ts <rows.json> --apply
 *
 * - New leads are created with every spreadsheet column in its own field.
 * - Leads whose email already exists (not deleted) are skipped, EXCEPT existing
 *   "Kevin Lead" rows: those get the new columns filled in (backfill) and their
 *   old packed-text description cleared. Ownership and status are never touched.
 * - Names (optional) are matched by first name; aborts unless each matches one user.
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
  if (!file) throw new Error("Usage: <rows.json> [name1 [name2]] [--apply]");
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

  // Columns of Kevin_Merged_Contacts_with_Postcodes.xlsx, looked up by header name.
  const all: string[][] = JSON.parse(fs.readFileSync(file, "utf8"));
  const col = (h: string) => all[0].findIndex((x) => x.trim().toLowerCase() === h.toLowerCase());
  const rows = all.slice(1);
  const clean = (v?: string) => {
    const t = (v || "").trim();
    return t && t !== "[]" ? t : null;
  };
  const pick = (r: string[], h: string) => clean(r[col(h)]);
  // Turns "['https://a', 'https://b']" (or a plain URL) into one URL per line.
  const urls = (r: string[], h: string) => {
    const v = pick(r, h);
    if (!v) return null;
    const found = v.split(/[^a-zA-Z0-9:/._~%?&=#@+-]+/).filter((u) => u.startsWith("http"));
    return found.length ? Array.from(new Set(found)).join(String.fromCharCode(10)) : v;
  };
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
    postcode: pick(r, "Postcode"),
    personalEmail: pick(r, "Personal Email"),
    personAddress: pick(r, "Person Address"),
    seniority: pick(r, "Seniority"),
    linkedinUrl: pick(r, "Personal LinkedIn"),
    profileSummary: pick(r, "Profile Summary"),
    companyLinkedinUrl: pick(r, "Company LinkedIn"),
    industry: pick(r, "Industries"),
    companySummary: pick(r, "Company Summary"),
    employeeCount: pick(r, "# Employees"),
    companyAddress: pick(r, "Company Address"),
    companyCity: pick(r, "Company City"),
    companyEmail: pick(r, "Company Email"),
    facebook: urls(r, "Facebook"),
    annualRevenue: pick(r, "Annual Revenue"),
  }));

  const type =
    (await prismadb.crm_Lead_Types.findUnique({ where: { name: LEAD_TYPE } })) ??
    (APPLY ? await prismadb.crm_Lead_Types.create({ data: { v: 0, name: LEAD_TYPE } }) : null);

  const existing = await prismadb.crm_Leads.findMany({
    where: { deletedAt: null, email: { in: leads.map((l) => l.email!).filter(Boolean), mode: "insensitive" } },
    select: { id: true, email: true, lead_type_id: true },
  });
  const byEmail = new Map(existing.map((e) => [e.email!.toLowerCase(), e]));

  const toBackfill: { id: string; data: (typeof leads)[number] }[] = [];
  const fresh: typeof leads = [];
  let skipped = 0;
  for (const l of leads) {
    const ex = l.email ? byEmail.get(l.email) : undefined;
    if (!ex) fresh.push(l);
    else if (type && ex.lead_type_id === type.id) toBackfill.push({ id: ex.id, data: l });
    else skipped++;
  }
  console.log(
    `${leads.length} rows: ${fresh.length} to create, ${toBackfill.length} Kevin leads to backfill, ${skipped} skipped (existing non-Kevin leads)`
  );

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

  for (const { id, data: d } of toBackfill) {
    const { email: _email, lastName: _ln, firstName: _fn, ...fields } = d;
    await prismadb.crm_Leads.update({ where: { id }, data: { ...fields, description: null } });
  }
  if (data.length) {
    const res = await prismadb.crm_Leads.createMany({
      data: data.map((d) => ({ ...d, lead_type_id: type!.id })),
    });
    console.log(`Created ${res.count} leads.`);
  }
  console.log(`Backfilled ${toBackfill.length} leads.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
