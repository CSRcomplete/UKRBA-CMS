"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface IndividualLeadInput {
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  postcode?: string;
}

export async function uploadLeads(leads: IndividualLeadInput[]) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized. Please log in." };
  }

  const userId = session.user.id;

  // Check user role
  const currentUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!currentUser) {
    return { error: "User profile not found." };
  }

  const allowedRoles = [
    "regional_director",
    "area_director",
    "admin",
    "ceo",
    "coo",
    "operations_director",
    "manager",
    "user",
  ];

  if (!allowedRoles.includes(currentUser.role)) {
    return { error: "Permission denied. Only Regional and Area Managers can upload leads." };
  }

  if (!leads || leads.length === 0) {
    return { error: "No leads provided to upload." };
  }

  try {
    // 1. Ensure "Partner Upload" lead type exists in crm_Lead_Types
    let partnerUploadType = await prismadb.crm_Lead_Types.findUnique({
      where: { name: "Partner Upload" },
    });

    if (!partnerUploadType) {
      partnerUploadType = await prismadb.crm_Lead_Types.create({
        data: {
          v: 0,
          name: "Partner Upload",
        },
      });
    }

    const now = new Date();

    // 2. Normalise each row, splitting into ones we can match against
    // existing leads (by email — the reliable identifier) and ones we can
    // only match by name + postcode together (name alone is not safe,
    // since two different people can share a name).
    const normalised = leads.map((lead) => {
      const fName = lead.firstName?.trim() || "";
      const lName = lead.lastName?.trim() || (fName ? "" : "Lead");
      return {
        firstName: fName || null,
        lastName: lName || "Lead",
        email: lead.email?.trim() || null,
        phone: lead.phone?.trim() || null,
        company: lead.company?.trim() || null,
        postcode: lead.postcode?.trim() || null,
      };
    });

    const emails = Array.from(
      new Set(normalised.filter((l) => l.email).map((l) => l.email!.toLowerCase()))
    );
    const noEmailRows = normalised.filter((l) => !l.email && l.postcode);

    // 3. Find existing leads to match against, in two batched queries
    // rather than one query per row.
    const [byEmail, byNamePostcode] = await Promise.all([
      emails.length > 0
        ? prismadb.crm_Leads.findMany({
            where: { deletedAt: null, email: { in: emails, mode: "insensitive" } },
          })
        : Promise.resolve([]),
      noEmailRows.length > 0
        ? prismadb.crm_Leads.findMany({
            where: {
              deletedAt: null,
              email: null,
              OR: noEmailRows.map((l) => ({
                firstName: { equals: l.firstName, mode: "insensitive" as const },
                lastName: { equals: l.lastName, mode: "insensitive" as const },
                postcode: { equals: l.postcode, mode: "insensitive" as const },
              })),
            },
          })
        : Promise.resolve([]),
    ]);

    const emailMatchMap = new Map(byEmail.map((l) => [l.email!.toLowerCase(), l]));
    const namePostcodeKey = (firstName: string | null, lastName: string, postcode: string | null) =>
      `${(firstName || "").toLowerCase()}|${lastName.toLowerCase()}|${(postcode || "").toLowerCase()}`;
    const namePostcodeMatchMap = new Map(
      byNamePostcode.map((l) => [namePostcodeKey(l.firstName, l.lastName, l.postcode), l])
    );

    // 4. Split into updates (matched an existing lead) and creates (no match)
    const toCreate: typeof normalised = [];
    const toUpdate: { id: string; data: (typeof normalised)[number] }[] = [];

    for (const lead of normalised) {
      const existing = lead.email
        ? emailMatchMap.get(lead.email.toLowerCase())
        : lead.postcode
          ? namePostcodeMatchMap.get(namePostcodeKey(lead.firstName, lead.lastName, lead.postcode))
          : undefined;

      if (existing) {
        toUpdate.push({ id: existing.id, data: lead });
      } else {
        toCreate.push(lead);
      }
    }

    // 5. Apply updates — only overwrite fields the new row actually has a
    // value for, so a partially-filled re-upload can't blank out existing
    // data. Ownership/status/type are deliberately left untouched; only
    // contact details refresh.
    await Promise.all(
      toUpdate.map(({ id, data }) =>
        prismadb.crm_Leads.update({
          where: { id },
          data: {
            updatedAt: now,
            updatedBy: userId,
            ...(data.firstName ? { firstName: data.firstName } : {}),
            ...(data.lastName ? { lastName: data.lastName } : {}),
            ...(data.email ? { email: data.email } : {}),
            ...(data.phone ? { phone: data.phone } : {}),
            ...(data.company ? { company: data.company } : {}),
            ...(data.postcode ? { postcode: data.postcode } : {}),
          },
        })
      )
    );

    // 6. Create genuinely new leads
    if (toCreate.length > 0) {
      await prismadb.crm_Leads.createMany({
        data: toCreate.map((lead) => ({
          v: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
          assigned_to: userId,
          company: lead.company,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          postcode: lead.postcode,
          lead_type_id: partnerUploadType.id,
          lead_status_id: null, // Blank status as requested
        })),
      });
    }

    revalidatePath("/[locale]/(routes)/crm/leads");
    revalidatePath("/crm/leads");

    return {
      success: true,
      count: toCreate.length + toUpdate.length,
      created: toCreate.length,
      updated: toUpdate.length,
    };
  } catch (err: any) {
    console.error("Error uploading leads:", err);
    return { error: err.message || "Failed to save uploaded leads to database." };
  }
}
