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

    // 2. Prepare database records
    const recordsToInsert = leads.map((lead) => {
      const fName = lead.firstName?.trim() || "";
      const lName = lead.lastName?.trim() || (fName ? "" : "Lead");

      return {
        v: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
        assigned_to: userId,
        company: lead.company?.trim() || null,
        firstName: fName || null,
        lastName: lName || "Lead",
        email: lead.email?.trim() || null,
        phone: lead.phone?.trim() || null,
        postcode: lead.postcode?.trim() || null,
        lead_type_id: partnerUploadType.id,
        lead_status_id: null, // Blank status as requested
      };
    });

    // 3. Batch create using createMany or transaction
    await prismadb.crm_Leads.createMany({
      data: recordsToInsert,
    });

    revalidatePath("/[locale]/(routes)/crm/leads");
    revalidatePath("/crm/leads");

    return { success: true, count: recordsToInsert.length };
  } catch (err: any) {
    console.error("Error uploading leads:", err);
    return { error: err.message || "Failed to save uploaded leads to database." };
  }
}
