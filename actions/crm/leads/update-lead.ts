"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import sendEmail from "@/lib/sendmail";
import { inngest } from "@/inngest/client";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";
import { logOwnershipChange } from "@/lib/ownership";

export const updateLead = async (data: {
  id: string;
  firstName?: string | null;
  lastName: string;
  company?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  lead_source_id?: string | null;
  lead_status_id?: string | null;
  lead_type_id?: string | null;
  refered_by?: string | null;
  campaign?: string | null;
  assigned_to?: string;
  accountIDs?: string;
  change_reason?: string | null;
  website?: string | null;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const userId = session.user.id;
  const {
    id,
    firstName,
    lastName,
    company,
    jobTitle,
    email,
    phone,
    website,
    description,
    lead_source_id,
    lead_status_id,
    lead_type_id,
    refered_by,
    campaign,
    assigned_to,
    accountIDs,
    change_reason,
  } = data;

  if (!id) return { error: "id is required" };

  try {
    const before = await prismadb.crm_Leads.findUnique({ where: { id, deletedAt: null } });

    // Determine the assignee and directors
    const targetAssigneeId = assigned_to || before?.assigned_to || userId;
    let areaDirectorId: string | null = before?.assigned_area_director_id || null;
    let regionalDirectorId: string | null = before?.assigned_regional_director_id || null;

    if (assigned_to && assigned_to !== before?.assigned_to) {
      // Owner changed, resolve directors for new owner
      const newOwner = await prismadb.users.findUnique({
        where: { id: assigned_to },
      });
      if (newOwner) {
        if (newOwner.role === "user") {
          areaDirectorId = newOwner.parentId;
          if (areaDirectorId) {
            const ad = await prismadb.users.findUnique({ where: { id: areaDirectorId } });
            regionalDirectorId = ad?.parentId || null;
          } else {
            regionalDirectorId = null;
          }
        } else if (newOwner.role === "manager") {
          areaDirectorId = newOwner.id;
          regionalDirectorId = newOwner.parentId;
        } else {
          areaDirectorId = null;
          regionalDirectorId = null;
        }
      }
    }

    const lead = await prismadb.crm_Leads.update({
      where: { id },
      data: {
        v: 1,
        updatedBy: userId,
        firstName,
        lastName,
        company,
        jobTitle,
        email,
        phone,
        website,
        description,
        lead_source_id: lead_source_id || undefined,
        lead_status_id: lead_status_id || undefined,
        lead_type_id: lead_type_id || undefined,
        refered_by,
        campaign,
        assigned_to: targetAssigneeId,
        assigned_area_director_id: areaDirectorId,
        assigned_regional_director_id: regionalDirectorId,
        accountsIDs: accountIDs,
      },
    });

    // Handle lead conversion to member record
    if (lead_status_id) {
      const statusRecord = await prismadb.crm_Lead_Statuses.findUnique({
        where: { id: lead_status_id },
      });
      if (statusRecord && statusRecord.name === "Lead converted or closed") {
        const existingMember = await prismadb.crm_Members.findUnique({
          where: { lead_id: lead.id },
        });
        if (!existingMember) {
          await prismadb.crm_Members.create({
            data: {
              lead_id: lead.id,
              business_name: lead.company || "N/A",
              contact_name: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
              telephone: lead.phone || "N/A",
              email: lead.email || "N/A",
              assigned_channel_partner_id: lead.assigned_partner_id || lead.assigned_to || null,
              assigned_area_director_id: lead.assigned_area_director_id || null,
              assigned_regional_director_id: lead.assigned_regional_director_id || null,
              lifecycle_status: "Membership",
            },
          });
        }
      }
    }

    if (before && before.assigned_to !== lead.assigned_to) {
      await logOwnershipChange({
        entityType: "lead",
        entityId: lead.id,
        previousOwnerId: before.assigned_to,
        newOwnerId: lead.assigned_to,
        areaDirectorId: lead.assigned_area_director_id,
        regionalDirectorId: lead.assigned_regional_director_id,
        changedById: userId,
        changeReason: change_reason || "Manual reassignment",
      });
    }

    if (assigned_to && assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: { id: assigned_to },
      });

      if (notifyRecipient) {
        await sendEmail({
          from: process.env.EMAIL_FROM as string,
          to: notifyRecipient.email || "info@softbase.cz",
          subject:
            notifyRecipient.userLanguage === "en"
              ? `New lead ${firstName} ${lastName} has been added to the system and assigned to you.`
              : `Nová příležitost ${firstName} ${lastName} byla přidána do systému a přidělena vám.`,
          text:
            notifyRecipient.userLanguage === "en"
              ? `New lead ${firstName} ${lastName} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${lead.id}`
              : `Nová příležitost ${firstName} ${lastName} byla přidána do systému a přidělena vám. Detaily naleznete zde: ${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${lead.id}`,
        });
      }
    }

    const changes = before ? diffObjects(before as Record<string, unknown>, lead as Record<string, unknown>) : null;
    await writeAuditLog({
      entityType: "lead",
      entityId: lead.id,
      action: "updated",
      changes,
      userId: session.user.id,
    });
    void inngest.send({ name: "crm/lead.saved", data: { record_id: lead.id } });
    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    return { data: lead };
  } catch (error) {
    console.log("[UPDATE_LEAD]", error);
    return { error: "Failed to update lead" };
  }
};
