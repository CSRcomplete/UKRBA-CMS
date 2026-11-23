import { prismadb } from "@/lib/prisma";

/** Lowercase, strip punctuation and company suffixes so "Acme Ltd." matches "ACME Limited". */
export function normaliseBusinessName(name: string | null | undefined): string {
  return (name || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(limited|ltd|llp|plc|inc|co|company|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalisePostcode(pc: string | null | undefined): string {
  return (pc || "").toUpperCase().replace(/\s+/g, "");
}

/**
 * Finds the existing lead an assessment belongs to.
 * 1. Exact email match (case-insensitive) — most recently updated wins.
 * 2. Business name + postcode (both normalised) — only when exactly one lead matches, so an
 *    ambiguous match never exposes an assessment to the wrong RD/AD.
 * Returns null when no confident match exists.
 */
export async function findLeadForAssessment(input: {
  email?: string | null;
  businessName?: string | null;
  postcode?: string | null;
}): Promise<{ id: string; matchedBy: "email" | "business_postcode" } | null> {
  const email = input.email?.trim();
  if (email) {
    const byEmail = await prismadb.crm_Leads.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (byEmail) return { id: byEmail.id, matchedBy: "email" };
  }

  const name = normaliseBusinessName(input.businessName);
  const postcode = normalisePostcode(input.postcode);
  if (name && postcode) {
    const candidates = await prismadb.crm_Leads.findMany({
      where: {
        deletedAt: null,
        postcode: { not: null },
        company: { contains: name.split(" ")[0], mode: "insensitive" },
      },
      select: { id: true, company: true, postcode: true },
      take: 200,
    });
    const matches = candidates.filter(
      (l) =>
        normalisePostcode(l.postcode) === postcode &&
        normaliseBusinessName(l.company) === name
    );
    if (matches.length === 1) return { id: matches[0].id, matchedBy: "business_postcode" };
  }

  return null;
}
