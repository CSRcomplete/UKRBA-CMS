"use server";

import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, filterAuthorizedLeadIds } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export const createTargetListFromLeads = async (leadIds: string[], listName: string, description?: string) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch {
    return { error: "Unauthorized" };
  }

  const name = listName.trim();
  if (!name) return { error: "List name is required" };
  if (!leadIds || leadIds.length === 0) return { error: "No leads selected" };

  const authorizedIds = await filterAuthorizedLeadIds(user, leadIds);
  if (authorizedIds.length === 0) return { error: "None of the selected leads are visible to you" };

  const leads = await prismadb.crm_Leads.findMany({
    where: { id: { in: authorizedIds }, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, company: true, postcode: true },
  });

  const targetIds: string[] = [];
  let skippedNoEmail = 0;

  for (const lead of leads) {
    const email = lead.email?.trim().toLowerCase();
    if (!email) {
      skippedNoEmail++;
      continue;
    }

    let target = await prismadb.crm_Targets.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
      select: { id: true },
    });

    if (!target) {
      target = await prismadb.crm_Targets.create({
        data: {
          first_name: lead.firstName || null,
          last_name: lead.lastName || "Lead",
          email,
          mobile_phone: lead.phone || null,
          company: lead.company || null,
          city: lead.postcode || null,
          created_by: user.id,
        },
        select: { id: true },
      });
    }

    targetIds.push(target.id);
  }

  if (targetIds.length === 0) {
    return { error: "None of the selected leads have an email address to add to a target list" };
  }

  const list = await prismadb.crm_TargetLists.create({
    data: {
      name,
      description: description?.trim() || `Created from ${leads.length} filtered lead(s) on ${new Date().toLocaleDateString("en-GB")}`,
      created_by: user.id,
      targets: {
        create: Array.from(new Set(targetIds)).map((id) => ({ target_id: id })),
      },
    },
  });

  revalidatePath("/[locale]/(routes)/campaigns/target-lists", "page");

  return {
    success: true,
    targetListId: list.id,
    addedCount: new Set(targetIds).size,
    skippedNoEmail,
  };
};
