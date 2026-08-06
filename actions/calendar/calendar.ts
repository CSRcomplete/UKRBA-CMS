"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { generateICSString } from "@/lib/ics-generator";
import nodemailer from "nodemailer";
import { decrypt } from "@/lib/email-crypto";

import { GROUP_TARGET_UUIDS } from "@/lib/constants/group-assignments";

export type CalendarEventType = "appointment" | "meeting" | "task";

export type UnifiedCalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  status?: string;
  priority?: string;
  attendees?: string[];
  notes?: string | null;
  reminderMin?: number | null;
  sourceId: string;
  editable: boolean;
  meetingUrl?: string | null;
};

async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getCalendarEvents(
  startDateStr: string,
  endDateStr: string
): Promise<UnifiedCalendarEvent[]> {
  const user = await requireSession();
  const userId = user.id as string;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  const role = (dbUser?.role || user.role || "").toLowerCase();
  const isLeadership = ["admin", "ceo", "coo", "operations_director", "regional_director", "area_director", "manager"].includes(role);

  let startDate: Date;
  let endDate: Date;

  if (startDateStr) {
    startDate = new Date(startDateStr);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }

  if (endDateStr) {
    endDate = new Date(endDateStr);
  } else {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);
  }

  // 1. Query Appointments (Overlapping date range)
  const appointmentWhere: any = {
    deletedAt: null,
    startTime: { lte: endDate },
    endTime: { gte: startDate },
  };

  if (!isLeadership) {
    appointmentWhere.userId = userId;
  }

  const appointments = await prismadb.crm_Appointments.findMany({
    where: appointmentWhere,
    orderBy: { startTime: "asc" },
  });

  // 2. Query CRM Meetings/Activities (crm_Activities)
  const activityWhere: any = {
    deletedAt: null,
    date: { gte: startDate, lte: endDate },
  };

  if (!isLeadership) {
    activityWhere.createdBy = userId;
  }

  const activities = await prismadb.crm_Activities.findMany({
    where: activityWhere,
    orderBy: { date: "asc" },
  });

  // 3. Query Assigned Tasks (Tasks)
  const allowedGroupTargets: string[] = ["ALL_USERS", GROUP_TARGET_UUIDS.ALL_USERS];
  if (role === "regional_director" || role === "admin" || role === "ceo" || role === "coo") {
    allowedGroupTargets.push("ALL_REGIONAL_DIRECTORS", GROUP_TARGET_UUIDS.ALL_REGIONAL_DIRECTORS);
  }
  if (role === "area_director" || role === "operations_director" || role === "admin" || role === "ceo" || role === "coo") {
    allowedGroupTargets.push("ALL_AREA_DIRECTORS", GROUP_TARGET_UUIDS.ALL_AREA_DIRECTORS);
  }
  if (role === "channel_partner" || role === "admin" || role === "ceo" || role === "coo") {
    allowedGroupTargets.push("ALL_CHANNEL_PARTNERS", GROUP_TARGET_UUIDS.ALL_CHANNEL_PARTNERS);
  }

  const taskWhere: any = {
    dueDateAt: { gte: startDate, lte: endDate },
  };

  if (!isLeadership) {
    taskWhere.OR = [
      { user: userId },
      { user: { in: allowedGroupTargets } },
    ];
  }

  const tasks = await prismadb.tasks.findMany({
    where: taskWhere,
    orderBy: { dueDateAt: "asc" },
  });

  const unifiedEvents: UnifiedCalendarEvent[] = [];

  // Add Appointments
  appointments.forEach((apt) => {
    let meetingUrl: string | null = null;
    if (apt.location && (apt.location.startsWith("http://") || apt.location.startsWith("https://"))) {
      meetingUrl = apt.location;
    } else {
      const match = (apt.description || "").match(/https?:\/\/[^\s]+/);
      if (match) meetingUrl = match[0];
    }

    unifiedEvents.push({
      id: apt.id,
      type: "appointment",
      title: apt.title,
      description: apt.description,
      location: apt.location,
      startTime: apt.startTime.toISOString(),
      endTime: apt.endTime.toISOString(),
      isAllDay: apt.isAllDay,
      notes: apt.notes,
      reminderMin: apt.reminderMin,
      attendees: Array.isArray(apt.attendees) ? (apt.attendees as string[]) : [],
      sourceId: apt.id,
      editable: true,
      meetingUrl,
    });
  });

  // Add CRM Meetings
  activities.forEach((act) => {
    const actStart = new Date(act.date);
    const durationMin = act.duration || 30;
    const actEnd = new Date(actStart.getTime() + durationMin * 60 * 1000);

    const meta = act.metadata as Record<string, any> | null;
    let meetingUrl: string | null = meta?.zoomJoinUrl ?? meta?.meetingLink ?? meta?.meetingUrl ?? null;

    const actLocation = (meta?.location as string | undefined) || (act.type === "meeting" ? "CRM Video Meeting" : "Phone Call");

    if (!meetingUrl) {
      const match = ((meta?.location as string) || "").match(/https?:\/\/[^\s]+/) || (act.description || "").match(/https?:\/\/[^\s]+/);
      if (match) {
        meetingUrl = match[0];
      }
    }

    unifiedEvents.push({
      id: `act-${act.id}`,
      type: "meeting",
      title: `${act.type === "call" ? "📞 Call" : "🤝 Meeting"}: ${act.title}`,
      description: act.description,
      location: actLocation,
      startTime: actStart.toISOString(),
      endTime: actEnd.toISOString(),
      isAllDay: false,
      status: act.status,
      sourceId: act.id,
      editable: false,
      meetingUrl,
    });
  });

  // Add Assigned Tasks
  tasks.forEach((tsk) => {
    if (!tsk.dueDateAt) return;
    const tskDate = new Date(tsk.dueDateAt);

    unifiedEvents.push({
      id: `tsk-${tsk.id}`,
      type: "task",
      title: `📋 Task: ${tsk.title}`,
      description: tsk.content,
      startTime: tskDate.toISOString(),
      endTime: new Date(tskDate.getTime() + 60 * 60 * 1000).toISOString(),
      isAllDay: true,
      priority: tsk.priority,
      status: tsk.taskStatus || "ACTIVE",
      sourceId: tsk.id,
      editable: false,
    });
  });

  return unifiedEvents;
}

export type CreateAppointmentInput = {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  attendees?: string[];
  reminderMin?: number;
  notes?: string;
};

export async function createAppointment(input: CreateAppointmentInput) {
  const currentUser = await requireSession();
  const userId = currentUser.id as string;

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  const created = await prismadb.crm_Appointments.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      location: input.location,
      startTime,
      endTime,
      isAllDay: input.isAllDay ?? false,
      attendees: input.attendees ?? [],
      reminderMin: input.reminderMin ?? 15,
      notes: input.notes,
    },
  });

  // Dispatch Email Invitations with .ics Calendar attachment if attendees specified
  if (input.attendees && input.attendees.length > 0) {
    sendCalendarInvitations({
      userId,
      event: {
        id: created.id,
        title: created.title,
        description: created.description,
        location: created.location,
        startTime,
        endTime,
        organizerName: currentUser.name || "UKRBA Staff",
        organizerEmail: currentUser.email || undefined,
        attendees: input.attendees,
      },
    }).catch(() => {});
  }

  return created;
}

export async function updateAppointment(id: string, input: Partial<CreateAppointmentInput>) {
  const currentUser = await requireSession();
  const userId = currentUser.id as string;

  const existing = await prismadb.crm_Appointments.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) throw new Error("Appointment not found");

  const startTime = input.startTime ? new Date(input.startTime) : existing.startTime;
  const endTime = input.endTime ? new Date(input.endTime) : existing.endTime;

  const updated = await prismadb.crm_Appointments.update({
    where: { id },
    data: {
      title: input.title ?? existing.title,
      description: input.description !== undefined ? input.description : existing.description,
      location: input.location !== undefined ? input.location : existing.location,
      startTime,
      endTime,
      isAllDay: input.isAllDay !== undefined ? input.isAllDay : existing.isAllDay,
      attendees: input.attendees !== undefined ? input.attendees : (existing.attendees as any),
      reminderMin: input.reminderMin !== undefined ? input.reminderMin : existing.reminderMin,
      notes: input.notes !== undefined ? input.notes : existing.notes,
    },
  });

  return updated;
}

export async function deleteAppointment(id: string) {
  const currentUser = await requireSession();
  const userId = currentUser.id as string;

  const existing = await prismadb.crm_Appointments.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) throw new Error("Appointment not found");

  await prismadb.crm_Appointments.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

async function sendCalendarInvitations({
  userId,
  event,
}: {
  userId: string;
  event: any;
}) {
  try {
    const emailAccount = await prismadb.emailAccount.findFirst({
      where: { userId },
    });

    if (!emailAccount) return;

    const icsContent = generateICSString(event);
    const password = decrypt(emailAccount.passwordEncrypted);

    const transporter = nodemailer.createTransport({
      host: emailAccount.smtpHost,
      port: emailAccount.smtpPort,
      secure: emailAccount.smtpSsl,
      auth: { user: emailAccount.username, pass: password },
    });

    const validAttendees = (event.attendees as string[]).filter((e) => e && e.includes("@"));
    if (validAttendees.length === 0) return;

    await transporter.sendMail({
      from: emailAccount.username,
      to: validAttendees.join(", "),
      subject: `Calendar Invitation: ${event.title}`,
      text: `You have been invited to a calendar appointment: ${event.title}.\n\nDate: ${new Date(event.startTime).toLocaleString()}\nLocation: ${event.location || "N/A"}\n\nPlease see attached calendar file (.ics) to add to your diary.`,
      attachments: [
        {
          filename: "invite.ics",
          content: icsContent,
          contentType: "text/calendar; method=REQUEST; charset=UTF-8",
        },
      ],
    });
  } catch {
    // Non-blocking background invitation error
  }
}
