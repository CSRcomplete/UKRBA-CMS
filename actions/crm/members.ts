"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializeDecimals, serializeDecimalsList } from "@/lib/serialize-decimals";
import { writeAuditLog } from "@/lib/audit-log";

// Helper to check user roles and build member filters
async function memberScopeWhere(user: any) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }

  if (user.role === "regional_director") {
    return {
      deletedAt: null,
      assigned_regional_director_id: user.id,
    };
  }

  if (user.role === "area_director") {
    return {
      deletedAt: null,
      assigned_area_director_id: user.id,
    };
  }

  if (user.role === "channel_partner") {
    return {
      deletedAt: null,
      assigned_channel_partner_id: user.id,
    };
  }

  return {
    deletedAt: null,
    OR: [
      { assigned_channel_partner_id: user.id },
      { assigned_area_director_id: user.id },
      { assigned_regional_director_id: user.id },
    ],
  };
}

export const getMembers = async () => {
  const session = await getSession();
  if (!session) return [];

  const scope = await memberScopeWhere(session.user);
  const members = await prismadb.crm_Members.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
  });

  return serializeDecimalsList(members);
};

export const getMember = async (id: string) => {
  const session = await getSession();
  if (!session) return null;

  const scope = await memberScopeWhere(session.user);
  const member = await prismadb.crm_Members.findFirst({
    where: {
      id,
      ...scope,
    },
  });

  if (!member) return null;

  // Let's also fetch related lead and ownership history if needed
  const lead = await prismadb.crm_Leads.findUnique({
    where: { id: member.lead_id },
    include: {
      assigned_to_user: {
        select: { name: true, email: true },
      },
    },
  });

  return {
    ...serializeDecimals(member),
    lead: lead ? serializeDecimals(lead) : null,
  };
};

export const updateMember = async (data: {
  id: string;
  business_name?: string;
  contact_name?: string;
  telephone?: string;
  email?: string;
  lifecycle_status?: string;
  assigned_channel_partner_id?: string | null;
  assigned_area_director_id?: string | null;
  assigned_regional_director_id?: string | null;
  recurring_revenue_tier?: number | null;
  partner_commission_rate?: number | null;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const {
    id,
    business_name,
    contact_name,
    telephone,
    email,
    lifecycle_status,
    assigned_channel_partner_id,
    assigned_area_director_id,
    assigned_regional_director_id,
    recurring_revenue_tier,
    partner_commission_rate,
  } = data;

  try {
    const before = await prismadb.crm_Members.findUnique({ where: { id } });
    if (!before) return { error: "Member not found" };

    const member = await prismadb.crm_Members.update({
      where: { id },
      data: {
        business_name,
        contact_name,
        telephone,
        email,
        lifecycle_status,
        assigned_channel_partner_id,
        assigned_area_director_id,
        assigned_regional_director_id,
        recurring_revenue_tier: recurring_revenue_tier !== undefined ? recurring_revenue_tier : undefined,
        partner_commission_rate: partner_commission_rate !== undefined ? partner_commission_rate : undefined,
      },
    });

    await writeAuditLog({
      entityType: "member",
      entityId: id,
      action: "updated",
      userId: session.user.id,
      changes: [
        { field: "lifecycle_status", old: before.lifecycle_status, new: member.lifecycle_status }
      ],
    });

    revalidatePath("/[locale]/(routes)/crm/members", "page");
    return { data: serializeDecimals(member) };
  } catch (error) {
    console.log("[UPDATE_MEMBER_ERROR]", error);
    return { error: "Failed to update member" };
  }
};
