"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { leadReadScopeWhere } from "@/lib/authz";
import resendHelper from "@/lib/resend";

const ROLE_DESIGNATIONS: Record<string, string> = {
  ceo: "CEO - UKRBA SME",
  operations_director: "Operations Director",
  regional_director: "Regional Director",
  area_director: "Area Director",
  channel_partner: "Channel Partner",
  admin: "Admin",
  user: "Staff",
};

// Define rank mapping for hierarchy comparison
const ROLE_RANKS: Record<string, number> = {
  ceo: 5,
  admin: 5,
  operations_director: 4,
  regional_director: 3,
  area_director: 2,
  channel_partner: 1,
  user: 1,
};

function getUserRank(role: string | null | undefined): number {
  if (!role) return 0;
  return ROLE_RANKS[role.toLowerCase()] || 0;
}

export const getMeetings = async () => {
  const session = await getSession();
  if (!session) return [];

  const userId = session.user.id;

  // Fetch all activities of type meeting where the user is connected
  // (either created by the user or linked to the user via activity links)
  const activities = await prismadb.crm_Activities.findMany({
    where: {
      type: "meeting",
      deletedAt: null,
      OR: [
        { createdBy: userId },
        {
          links: {
            some: {
              entityType: "user",
              entityId: userId,
            },
          },
        },
      ],
    },
    include: {
      created_by_user: {
        select: { name: true, email: true },
      },
      links: true,
    },
    orderBy: { date: "desc" },
  });

  // Fetch user names and lead names to resolve links in-memory
  const userLinks = activities.flatMap((a) =>
    a.links.filter((l) => l.entityType === "user").map((l) => l.entityId)
  );
  const leadLinks = activities.flatMap((a) =>
    a.links.filter((l) => l.entityType === "lead").map((l) => l.entityId)
  );

  const users = await prismadb.users.findMany({
    where: { id: { in: userLinks } },
    select: { id: true, name: true, email: true },
  });
  const leads = await prismadb.crm_Leads.findMany({
    where: { id: { in: leadLinks } },
    select: { id: true, firstName: true, lastName: true, company: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.name || u.email]));
  const leadMap = new Map(leads.map((l) => [l.id, `${l.firstName} ${l.lastName} (${l.company || "N/A"})`]));

  return activities.map((activity) => {
    const invitees = activity.links
      .map((link) => {
        if (link.entityType === "user") {
          return { type: "Staff", name: userMap.get(link.entityId) || "Unknown Staff" };
        } else if (link.entityType === "lead") {
          return { type: "Lead", name: leadMap.get(link.entityId) || "Unknown Lead" };
        }
        return null;
      })
      .filter(Boolean);

    return {
      ...activity,
      invitees,
    };
  });
};

export const getTargetsForMeetingBooking = async () => {
  const session = await getSession();
  if (!session) return { users: [], leads: [] };

  const currentUserRole = session.user.role || "user";
  const currentUserRank = getUserRank(currentUserRole);

  // 1. Fetch eligible staff (users whose rank is strictly LESS than current user's rank)
  const allUsers = await prismadb.users.findMany({
    where: { userStatus: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  const eligibleUsers = allUsers.filter((u) => {
    // Cannot book meeting with self
    if (u.id === session.user.id) return false;
    const rank = getUserRank(u.role);
    return rank < currentUserRank;
  });

  // 2. Fetch eligible leads (scoped to current user's visibility)
  const leadScope = await leadReadScopeWhere(session.user as any);
  const leads = await prismadb.crm_Leads.findMany({
    where: leadScope,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
    },
    orderBy: { firstName: "asc" },
  });

  return {
    users: eligibleUsers,
    leads: leads.map((l) => ({
      id: l.id,
      name: `${l.firstName} ${l.lastName}`,
      company: l.company || "N/A",
    })),
  };
};

export const scheduleMeeting = async (data: {
  title: string;
  description: string;
  date: Date;
  duration?: number;
  meetingLink?: string;
  inviteeType: "user" | "lead";
  inviteeId: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { title, description, date, duration, meetingLink, inviteeType, inviteeId } = data;

  if (!title || !date || !inviteeId) {
    return { error: "Missing required fields" };
  }

  // Hierarchy validation
  if (inviteeType === "user") {
    const targetUser = await prismadb.users.findUnique({
      where: { id: inviteeId },
      select: { role: true },
    });

    if (!targetUser) return { error: "Invitee staff member not found" };

    const currentUserRank = getUserRank(session.user.role);
    const targetUserRank = getUserRank(targetUser.role);

    if (targetUserRank >= currentUserRank) {
      return { error: "Security Policy: You are not authorized to schedule a meeting with a superior or equal rank." };
    }
  }

  try {
    // Create the meeting activity
    const activity = await prismadb.crm_Activities.create({
      data: {
        type: "meeting",
        title,
        description,
        date: new Date(date),
        duration: duration || null,
        status: "scheduled",
        createdBy: session.user.id,
        updatedBy: session.user.id,
        metadata: meetingLink ? { meetingLink } : undefined,
      },
    });

    // Create the links
    // Link 1: To the creator (host)
    await prismadb.crm_ActivityLinks.create({
      data: {
        activityId: activity.id,
        entityType: "user",
        entityId: session.user.id,
      },
    });

    // Link 2: To the invitee
    await prismadb.crm_ActivityLinks.create({
      data: {
        activityId: activity.id,
        entityType: inviteeType,
        entityId: inviteeId,
      },
    });

    // Send email notification to invitee
    try {
      let inviteeEmail: string | null = null;
      if (inviteeType === "user") {
        const inviteeUser = await prismadb.users.findUnique({
          where: { id: inviteeId },
          select: { email: true },
        });
        inviteeEmail = inviteeUser?.email || null;
      } else if (inviteeType === "lead") {
        const inviteeLead = await prismadb.crm_Leads.findUnique({
          where: { id: inviteeId },
          select: { email: true },
        });
        inviteeEmail = inviteeLead?.email || null;
      }

      if (inviteeEmail) {
        let resend;
        try {
          resend = await resendHelper();
        } catch {
          resend = null;
        }

        if (resend) {
          const creatorName = session.user.name || session.user.email;
          const roleKey = (session.user.role || "").toLowerCase();
          const designation = ROLE_DESIGNATIONS[roleKey] || (session.user.role ? session.user.role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "");
          const hostString = designation ? `${creatorName} (${designation})` : creatorName;

          const dateFormatted = new Date(date).toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const meetingWith = hostString;
          const linkText = meetingLink ? meetingLink : "No link provided";

          const emailSubject = `Meeting with ${creatorName}`;

          await resend.emails.send({
            from: `${process.env.NEXT_PUBLIC_APP_NAME || "UKRBA CMS"} <${process.env.EMAIL_FROM || "noreply@ukrba.org"}>`,
            to: inviteeEmail,
            subject: emailSubject,
            text: `Hello,\n\nA new meeting has been scheduled with you.\n\n1- Meeting with: ${meetingWith}\n2- Meeting time and date: ${dateFormatted}\n3- Meeting Link: ${linkText}\n\nDescription:\n${description || "No description provided."}\n\nBest regards,\nUKRBA Team`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #1a365d; margin-top: 0;">New Meeting Scheduled</h2>
                <p>Hello,</p>
                <p>A new meeting has been scheduled with you.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <ol style="padding-left: 20px; margin: 20px 0;">
                  <li style="margin-bottom: 10px;"><strong>Meeting with:</strong> ${meetingWith}</li>
                  <li style="margin-bottom: 10px;"><strong>Meeting time and date:</strong> ${dateFormatted}</li>
                  <li style="margin-bottom: 10px;"><strong>Meeting Link:</strong> ${meetingLink ? `<a href="${meetingLink}" target="_blank" style="color: #3182ce; text-decoration: underline;">${meetingLink}</a>` : "No link provided"}</li>
                </ol>
                ${description ? `<p><strong>Description:</strong><br />${description.replace(/\n/g, "<br />")}</p>` : ""}
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 0.875rem; color: #718096; margin-bottom: 0;">Best regards,<br />UKRBA Team</p>
              </div>
            `
          });
        }
      }
    } catch (emailError) {
      console.error("[SCHEDULE_MEETING_EMAIL_ERROR]", emailError);
    }

    revalidatePath("/[locale]/(routes)/crm/meetings", "page");

    return { success: true };
  } catch (error) {
    console.error("[SCHEDULE_MEETING_ERROR]", error);
    return { error: "Failed to schedule meeting" };
  }
};
