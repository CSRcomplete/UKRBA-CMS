"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { leadReadScopeWhere } from "@/lib/authz";
import resendHelper from "@/lib/resend";
import { createZoomMeeting, isZoomConfigured, updateZoomMeeting, deleteZoomMeeting } from "@/lib/zoom";

const ROLE_DESIGNATIONS: Record<string, string> = {
  ceo: "CEO - UKRBA SME",
  coo: "COO - UKRBA SME",
  operations_director: "Operations Director",
  regional_director: "Regional Director",
  area_director: "Area Director",
  channel_partner: "Channel Partner",
  admin: "Admin",
  user: "Staff",
};

export const getMeetings = async () => {
  const session = await getSession();
  if (!session) return [];

  const userId = session.user.id;

  const now = new Date();
  const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activities = await prismadb.crm_Activities.findMany({
    where: {
      type: "meeting",
      deletedAt: null,
      date: { gte: windowStart, lte: windowEnd },
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
    orderBy: { date: "asc" },
  });

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
    const meta = activity.metadata as Record<string, any> | null;
    const meetingType: "video" | "phone" | "in_person" = meta?.meetingType || "video";
    const location: string | undefined = meta?.location;
    const zoomMeetingId: string | undefined = meta?.zoomMeetingId;
    const zoomJoinUrl = meetingType === "video" ? (meta?.zoomJoinUrl ?? meta?.meetingLink ?? null) : null;
    const isHost = activity.createdBy === userId;
    const zoomStartUrl = meetingType === "video" && isHost ? (meta?.zoomStartUrl ?? null) : null;

    const invitees = activity.links
      .map((link) => {
        if (link.entityType === "user") {
          return { type: "Staff", name: userMap.get(link.entityId) || "Unknown Staff" };
        } else if (link.entityType === "lead") {
          return { type: "Lead", name: leadMap.get(link.entityId) || "Unknown Lead" };
        }
        return null;
      })
      .filter(Boolean) as { type: string; name: string }[];

    const externalAttendees: { email: string; name?: string }[] = meta?.externalAttendees
      || (meta?.externalEmail ? [{ email: meta.externalEmail, name: meta.externalName }] : []);
    for (const ext of externalAttendees) {
      invitees.push({ type: "External", name: ext.name ? `${ext.name} (${ext.email})` : ext.email });
    }

    return {
      ...activity,
      invitees,
      meetingType,
      location,
      isHost,
      zoomMeetingId,
      zoomJoinUrl,
      zoomStartUrl,
    };
  });
};

export const getTargetsForMeetingBooking = async () => {
  const session = await getSession();
  if (!session) return { users: [], leads: [] };

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

  const eligibleUsers = allUsers.filter((u) => u.id !== session.user.id);

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

export interface MeetingInvitee {
  type: "user" | "lead" | "external";
  id?: string;
  externalEmail?: string;
  externalName?: string;
}

export const scheduleMeeting = async (data: {
  title: string;
  description: string;
  date: Date;
  duration?: number;
  invitees: MeetingInvitee[];
  meetingType?: "video" | "phone" | "in_person";
  location?: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { title, description, date, duration, meetingType = "video", location } = data;
  const invitees = (data.invitees || []).filter(
    (i) => (i.type !== "external" && i.id) || (i.type === "external" && i.externalEmail)
  );

  if (!title || !date) {
    return { error: "Missing required fields" };
  }
  if (invitees.length === 0) {
    return { error: "Please add at least one invitee" };
  }

  // Auto-create a Zoom meeting only for video meetings
  const isVideo = meetingType === "video";
  let zoomMeetingId: number | undefined;
  let zoomJoinUrl: string | undefined;
  let zoomStartUrl: string | undefined;

  if (isVideo) {
    if (!isZoomConfigured()) {
      return { error: "Zoom is not configured on this server. Ask an admin to set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET." };
    }
    try {
      const zoomMeeting = await createZoomMeeting({
        topic: title,
        startTime: new Date(date),
        durationMinutes: duration,
        agenda: description,
      });
      zoomMeetingId = zoomMeeting.id;
      zoomJoinUrl = zoomMeeting.joinUrl;
      zoomStartUrl = zoomMeeting.startUrl;
    } catch (zoomError) {
      console.error("[SCHEDULE_MEETING_ZOOM_ERROR]", zoomError);
      return { error: "Failed to create Zoom meeting. Please try again or contact an admin." };
    }
  }

  const externalAttendees = invitees
    .filter((i) => i.type === "external")
    .map((i) => ({ email: i.externalEmail!, name: i.externalName }));

  try {
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
        metadata: {
          meetingType,
          location: location || null,
          ...(externalAttendees.length > 0 ? { externalAttendees } : {}),
          ...(isVideo ? { zoomMeetingId, zoomJoinUrl, zoomStartUrl, meetingLink: zoomJoinUrl } : {}),
        },
      },
    });

    // Link to creator (host)
    await prismadb.crm_ActivityLinks.create({
      data: {
        activityId: activity.id,
        entityType: "user",
        entityId: session.user.id,
      },
    });

    // Link each existing-entity invitee (user/lead)
    for (const invitee of invitees) {
      if (invitee.type !== "external" && invitee.id) {
        await prismadb.crm_ActivityLinks.create({
          data: {
            activityId: activity.id,
            entityType: invitee.type,
            entityId: invitee.id,
          },
        });
      }
    }

    // Resolve an email address + display name for every invitee
    const emailTargets: { email: string; name?: string }[] = [];
    for (const invitee of invitees) {
      if (invitee.type === "user" && invitee.id) {
        const inviteeUser = await prismadb.users.findUnique({
          where: { id: invitee.id },
          select: { email: true, name: true },
        });
        if (inviteeUser?.email) emailTargets.push({ email: inviteeUser.email, name: inviteeUser.name || undefined });
      } else if (invitee.type === "lead" && invitee.id) {
        const inviteeLead = await prismadb.crm_Leads.findUnique({
          where: { id: invitee.id },
          select: { email: true, firstName: true, lastName: true },
        });
        if (inviteeLead?.email) {
          emailTargets.push({ email: inviteeLead.email, name: `${inviteeLead.firstName || ""} ${inviteeLead.lastName || ""}`.trim() || undefined });
        }
      } else if (invitee.type === "external" && invitee.externalEmail) {
        emailTargets.push({ email: invitee.externalEmail, name: invitee.externalName });
      }
    }

    // Email notification — sent to every invitee
    try {
      if (emailTargets.length > 0) {
        let resend;
        try { resend = await resendHelper(); } catch { resend = null; }

        if (resend) {
          const creatorName = session.user.name || session.user.email;
          const roleKey = (session.user.role || "").toLowerCase();
          const designation = ROLE_DESIGNATIONS[roleKey] || session.user.role?.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "";
          const hostString = designation ? `${creatorName} (${designation})` : creatorName;
          const dateFormatted = new Date(date).toLocaleString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
          });

          let typeLabel = "Video Meeting";
          let headerEmoji = "🎥";
          if (meetingType === "phone") {
            typeLabel = "Phone Call Meeting";
            headerEmoji = "📞";
          } else if (meetingType === "in_person") {
            typeLabel = "Face-to-Face Meeting";
            headerEmoji = "🤝";
          }

          let locationLineHtml = "";
          let locationLineText = "";
          if (meetingType === "video" && zoomJoinUrl) {
            locationLineHtml = `<li style="margin-bottom: 10px;"><strong>Video Room:</strong> <a href="${zoomJoinUrl}" target="_blank" style="color: #3182ce; text-decoration: underline; font-weight: bold;">Click here to join via Zoom</a></li>`;
            locationLineText = `Zoom Meeting: ${zoomJoinUrl}`;
          } else if (meetingType === "phone") {
            locationLineHtml = `<li style="margin-bottom: 10px;"><strong>Phone Details:</strong> ${location || "Phone call will be initiated at scheduled time."}</li>`;
            locationLineText = `Phone Details: ${location || "Phone call will be initiated at scheduled time."}`;
          } else if (meetingType === "in_person") {
            locationLineHtml = `<li style="margin-bottom: 10px;"><strong>Location / Venue:</strong> ${location || "Location to be confirmed."}</li>`;
            locationLineText = `Location / Venue: ${location || "Location to be confirmed."}`;
          }

          let tipBoxHtml = "";
          if (meetingType === "video") {
            tipBoxHtml = `<p style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 12px; border-radius: 4px; font-size: 0.875rem; color: #2b6cb0;">
              💡 <strong>Join via Zoom.</strong> Click the meeting link to join — the Zoom app will open automatically, or you can join from your browser.
            </p>`;
          } else if (meetingType === "phone") {
            tipBoxHtml = `<p style="background: #f7fafc; border-left: 4px solid #4a5568; padding: 12px; border-radius: 4px; font-size: 0.875rem; color: #2d3748;">
              📞 <strong>Phone Call Scheduled.</strong> Please ensure your phone is reachable at the designated meeting time.
            </p>`;
          } else {
            tipBoxHtml = `<p style="background: #f0fff4; border-left: 4px solid #38a169; padding: 12px; border-radius: 4px; font-size: 0.875rem; color: #276749;">
              🤝 <strong>Face-to-Face Meeting.</strong> We look forward to meeting with you in person!
            </p>`;
          }

          const otherAttendeeNames = emailTargets.length > 1
            ? emailTargets.map((t) => t.name || t.email).join(", ")
            : null;

          await Promise.allSettled(
            emailTargets.map((target) =>
              resend.emails.send({
                from: `${process.env.NEXT_PUBLIC_APP_NAME || "UKRBA CMS"} <${process.env.EMAIL_FROM || "noreply@ukrba.org"}>`,
                to: target.email,
                subject: `${typeLabel} with ${creatorName}`,
                text: `Hello,\n\nA new ${typeLabel.toLowerCase()} has been scheduled with you.\n\nMeeting with: ${hostString}\nDate & Time: ${dateFormatted}\nDuration: ${duration || 30} minutes\n${locationLineText}${otherAttendeeNames ? `\nOther attendees: ${otherAttendeeNames}` : ""}\n\nAgenda:\n${description || "No agenda provided."}\n\nBest regards,\nUKRBA Team`,
                html: `
                  <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #1a365d; margin-top: 0;">${headerEmoji} New ${typeLabel} Scheduled</h2>
                    <p>Hello,</p>
                    <p>A new ${typeLabel.toLowerCase()} has been scheduled with you via UKRBA CMS.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <ol style="padding-left: 20px; margin: 20px 0;">
                      <li style="margin-bottom: 10px;"><strong>Meeting with:</strong> ${hostString}</li>
                      <li style="margin-bottom: 10px;"><strong>Date & Time:</strong> ${dateFormatted}</li>
                      <li style="margin-bottom: 10px;"><strong>Duration:</strong> ${duration || 30} minutes</li>
                      ${locationLineHtml}
                      ${otherAttendeeNames ? `<li style="margin-bottom: 10px;"><strong>Other attendees:</strong> ${otherAttendeeNames}</li>` : ""}
                    </ol>
                    ${description ? `<p><strong>Agenda / Notes:</strong><br />${description.replace(/\n/g, "<br />")}</p>` : ""}
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    ${tipBoxHtml}
                    <p style="font-size: 0.875rem; color: #718096; margin-bottom: 0;">Best regards,<br />UKRBA Team</p>
                  </div>
                `,
              })
            )
          );
        }
      }
    } catch (emailError) {
      console.error("[SCHEDULE_MEETING_EMAIL_ERROR]", emailError);
    }

    revalidatePath("/[locale]/(routes)/crm/meetings", "page");
    return { success: true, zoomMeetingId, zoomJoinUrl, zoomStartUrl, meetingType };
  } catch (error) {
    console.error("[SCHEDULE_MEETING_ERROR]", error);
    return { error: "Failed to schedule meeting" };
  }
};

/**
 * Create an instant ad-hoc Zoom meeting (no scheduling, just a room)
 */
export const createInstantMeeting = async (title?: string) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (!isZoomConfigured()) {
    return { error: "Zoom is not configured on this server. Ask an admin to set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET." };
  }

  const roomTitle = title || `Instant Meeting ${new Date().toLocaleTimeString()}`;

  try {
    const zoomMeeting = await createZoomMeeting({ topic: roomTitle });

    await prismadb.crm_Activities.create({
      data: {
        type: "meeting",
        title: roomTitle,
        description: "Ad-hoc instant video meeting",
        date: new Date(),
        status: "scheduled",
        createdBy: session.user.id,
        updatedBy: session.user.id,
        metadata: {
          meetingType: "video",
          zoomMeetingId: zoomMeeting.id,
          zoomJoinUrl: zoomMeeting.joinUrl,
          zoomStartUrl: zoomMeeting.startUrl,
          meetingLink: zoomMeeting.joinUrl,
          instant: true,
        },
      },
    });

    revalidatePath("/[locale]/(routes)/crm/meetings", "page");
    return { success: true, zoomMeetingId: zoomMeeting.id, zoomJoinUrl: zoomMeeting.joinUrl, zoomStartUrl: zoomMeeting.startUrl };
  } catch (error) {
    console.error("[INSTANT_MEETING_ERROR]", error);
    return { error: "Failed to create instant meeting" };
  }
};

/** Resolves every invitee's email + display name for a meeting, for
 * cancellation/update notifications. */
async function resolveInviteeEmailTargets(activityId: string, excludeUserId: string) {
  const links = await prismadb.crm_ActivityLinks.findMany({ where: { activityId } });
  const emailTargets: { email: string; name?: string }[] = [];

  for (const link of links) {
    if (link.entityType === "user") {
      if (link.entityId === excludeUserId) continue;
      const user = await prismadb.users.findUnique({
        where: { id: link.entityId },
        select: { email: true, name: true },
      });
      if (user?.email) emailTargets.push({ email: user.email, name: user.name || undefined });
    } else if (link.entityType === "lead") {
      const lead = await prismadb.crm_Leads.findUnique({
        where: { id: link.entityId },
        select: { email: true, firstName: true, lastName: true },
      });
      if (lead?.email) emailTargets.push({ email: lead.email, name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || undefined });
    }
  }

  return emailTargets;
}

/**
 * Cancels a meeting: soft-deletes it, best-effort removes the underlying
 * Zoom meeting, and notifies invitees. Only the meeting's host may cancel.
 */
export const cancelMeeting = async (activityId: string) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const activity = await prismadb.crm_Activities.findUnique({
    where: { id: activityId },
  });
  if (!activity || activity.deletedAt) return { error: "Meeting not found" };
  if (activity.createdBy !== session.user.id) {
    return { error: "Only the meeting's host can cancel it" };
  }

  const meta = activity.metadata as Record<string, any> | null;

  if (meta?.zoomMeetingId) {
    try {
      await deleteZoomMeeting(meta.zoomMeetingId);
    } catch (zoomError) {
      console.error("[CANCEL_MEETING_ZOOM_ERROR]", zoomError);
      // Continue — the CRM record should still be cancelled even if the
      // Zoom API call fails (e.g. already deleted on Zoom's side).
    }
  }

  await prismadb.crm_Activities.update({
    where: { id: activityId },
    data: {
      status: "cancelled",
      deletedAt: new Date(),
      deletedBy: session.user.id,
      updatedBy: session.user.id,
    },
  });

  try {
    const emailTargets = await resolveInviteeEmailTargets(activityId, session.user.id);
    if (emailTargets.length > 0) {
      let resend;
      try { resend = await resendHelper(); } catch { resend = null; }
      if (resend) {
        const hostName = session.user.name || session.user.email;
        const dateFormatted = new Date(activity.date).toLocaleString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
        });
        await Promise.allSettled(
          emailTargets.map((target) =>
            resend.emails.send({
              from: `${process.env.NEXT_PUBLIC_APP_NAME || "UKRBA CMS"} <${process.env.EMAIL_FROM || "noreply@ukrba.org"}>`,
              to: target.email,
              subject: `Cancelled: ${activity.title}`,
              text: `Hello,\n\nThe meeting "${activity.title}" with ${hostName}, originally scheduled for ${dateFormatted}, has been cancelled.\n\nBest regards,\nUKRBA Team`,
              html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #b91c1c; margin-top: 0;">❌ Meeting Cancelled</h2>
                <p>Hello,</p>
                <p>The meeting <strong>"${activity.title}"</strong> with ${hostName}, originally scheduled for <strong>${dateFormatted}</strong>, has been cancelled.</p>
                <p style="font-size: 0.875rem; color: #718096;">Best regards,<br />UKRBA Team</p>
              </div>`,
            })
          )
        );
      }
    }
  } catch (emailError) {
    console.error("[CANCEL_MEETING_EMAIL_ERROR]", emailError);
  }

  revalidatePath("/[locale]/(routes)/crm/meetings", "page");
  return { success: true };
};

/**
 * Updates a meeting's basic details. Only the meeting's host may edit it.
 * Best-effort syncs the change to the underlying Zoom meeting and notifies
 * invitees.
 */
export const updateMeeting = async (
  activityId: string,
  data: {
    title: string;
    description?: string;
    date: Date;
    duration?: number;
    location?: string;
  }
) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const activity = await prismadb.crm_Activities.findUnique({
    where: { id: activityId },
  });
  if (!activity || activity.deletedAt) return { error: "Meeting not found" };
  if (activity.createdBy !== session.user.id) {
    return { error: "Only the meeting's host can edit it" };
  }
  if (!data.title || !data.date) return { error: "Missing required fields" };

  const meta = (activity.metadata as Record<string, any>) || {};

  if (meta.zoomMeetingId) {
    try {
      await updateZoomMeeting(meta.zoomMeetingId, {
        topic: data.title,
        startTime: new Date(data.date),
        durationMinutes: data.duration,
        agenda: data.description,
      });
    } catch (zoomError) {
      console.error("[UPDATE_MEETING_ZOOM_ERROR]", zoomError);
      return { error: "Failed to update the Zoom meeting. Please try again." };
    }
  }

  await prismadb.crm_Activities.update({
    where: { id: activityId },
    data: {
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      duration: data.duration || null,
      updatedBy: session.user.id,
      metadata: {
        ...meta,
        location: data.location ?? meta.location ?? null,
      },
    },
  });

  try {
    const emailTargets = await resolveInviteeEmailTargets(activityId, session.user.id);
    if (emailTargets.length > 0) {
      let resend;
      try { resend = await resendHelper(); } catch { resend = null; }
      if (resend) {
        const hostName = session.user.name || session.user.email;
        const dateFormatted = new Date(data.date).toLocaleString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
        });
        await Promise.allSettled(
          emailTargets.map((target) =>
            resend.emails.send({
              from: `${process.env.NEXT_PUBLIC_APP_NAME || "UKRBA CMS"} <${process.env.EMAIL_FROM || "noreply@ukrba.org"}>`,
              to: target.email,
              subject: `Updated: ${data.title}`,
              text: `Hello,\n\nThe meeting "${data.title}" with ${hostName} has been updated.\n\nNew date & time: ${dateFormatted}\nDuration: ${data.duration || 30} minutes\n\nBest regards,\nUKRBA Team`,
              html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #b45309; margin-top: 0;">✏️ Meeting Updated</h2>
                <p>Hello,</p>
                <p>The meeting <strong>"${data.title}"</strong> with ${hostName} has been updated.</p>
                <ul>
                  <li><strong>New date &amp; time:</strong> ${dateFormatted}</li>
                  <li><strong>Duration:</strong> ${data.duration || 30} minutes</li>
                </ul>
                <p style="font-size: 0.875rem; color: #718096;">Best regards,<br />UKRBA Team</p>
              </div>`,
            })
          )
        );
      }
    }
  } catch (emailError) {
    console.error("[UPDATE_MEETING_EMAIL_ERROR]", emailError);
  }

  revalidatePath("/[locale]/(routes)/crm/meetings", "page");
  return { success: true };
};
