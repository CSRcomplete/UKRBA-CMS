"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CandidateStatus =
  | "Applied"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Interviewed"
  | "Accepted"
  | "Contract Sent"
  | "Contract Signed"
  | "Rejected"
  | "Withdrawn";

export type ContractStatus = "None" | "Sent" | "Signed";
export type ActivityType = "note" | "call" | "email" | "interview" | "contract" | "other";

export type CandidateActivity = {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  userName: string;
};

export type CandidateItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  position: string;
  positionType: string;
  status: string;
  cvUrl: string | null;
  cvFileName: string | null;
  cvSize: number | null;
  interviewDate: string | null;
  interviewNotes: string | null;
  interviewedBy: string | null;
  contractStatus: string;
  contractSentAt: string | null;
  contractSignedAt: string | null;
  source: string;
  notes: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  activities: CandidateActivity[];
};

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const role = dbUser?.role?.toLowerCase() || "";
  if (!["admin", "ceo"].includes(role)) {
    throw new Error("Only authorized Administrators can access the Recruitment Centre.");
  }

  return { userId, role };
}

async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return { userId: session.user.id as string };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getCandidates(filters?: {
  status?: string;
  position?: string;
  source?: string;
}): Promise<{ candidates: CandidateItem[] }> {
  await requireAdmin();

  const where: any = { deletedAt: null };
  if (filters?.status && filters.status !== "All") where.status = filters.status;
  if (filters?.position) where.position = { contains: filters.position, mode: "insensitive" };
  if (filters?.source && filters.source !== "All") where.source = filters.source;

  const list = await prismadb.crm_Candidates.findMany({
    where,
    include: {
      createdBy: { select: { name: true, email: true } },
      activities: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const candidates: CandidateItem[] = list.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    address: c.address,
    position: c.position,
    positionType: c.positionType,
    status: c.status,
    cvUrl: c.cvUrl,
    cvFileName: c.cvFileName,
    cvSize: c.cvSize,
    interviewDate: c.interviewDate?.toISOString() ?? null,
    interviewNotes: c.interviewNotes,
    interviewedBy: c.interviewedBy,
    contractStatus: c.contractStatus,
    contractSentAt: c.contractSentAt?.toISOString() ?? null,
    contractSignedAt: c.contractSignedAt?.toISOString() ?? null,
    source: c.source,
    notes: c.notes,
    createdById: c.createdById,
    createdByName: c.createdBy.name || c.createdBy.email || "Admin",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    activities: c.activities.map((a) => ({
      id: a.id,
      type: a.type,
      content: a.content,
      createdAt: a.createdAt.toISOString(),
      userName: a.user.name || a.user.email || "Admin",
    })),
  }));

  return { candidates };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateCandidateInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  position: string;
  positionType?: string;
  status?: string;
  source?: string;
  notes?: string;
  cv?: {
    name: string;
    content: string; // base64
    contentType?: string;
    size?: number;
  };
};

export async function createCandidate(input: CreateCandidateInput) {
  const { userId } = await requireAdmin();

  let cvUrl: string | undefined;
  let cvFileName: string | undefined;
  let cvSize: number | undefined;

  if (input.cv) {
    cvFileName = input.cv.name;
    cvSize = input.cv.size ?? Buffer.from(input.cv.content, "base64").byteLength;
    cvUrl = `data:${input.cv.contentType || "application/octet-stream"};base64,${input.cv.content}`;
  }

  const candidate = await prismadb.crm_Candidates.create({
    data: {
      createdById: userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      position: input.position,
      positionType: input.positionType ?? "Full-time",
      status: input.status ?? "Applied",
      source: input.source ?? "Manual",
      notes: input.notes,
      cvUrl,
      cvFileName,
      cvSize,
    },
  });

  // Auto-log creation activity
  await prismadb.crm_CandidateActivities.create({
    data: {
      candidateId: candidate.id,
      userId,
      type: "note",
      content: `Candidate profile created. Applied for: ${input.position} (${input.positionType ?? "Full-time"}). Source: ${input.source ?? "Manual"}.`,
    },
  });

  return candidate;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export type UpdateCandidateInput = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  positionType: string;
  status: string;
  source: string;
  notes: string;
  interviewDate: string;
  interviewNotes: string;
  interviewedBy: string;
  contractStatus: string;
  contractSentAt: string;
  contractSignedAt: string;
  cv: {
    name: string;
    content: string;
    contentType?: string;
    size?: number;
  };
}>;

export async function updateCandidate(id: string, input: UpdateCandidateInput) {
  const { userId } = await requireAdmin();

  const data: any = {};

  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.address !== undefined) data.address = input.address;
  if (input.position !== undefined) data.position = input.position;
  if (input.positionType !== undefined) data.positionType = input.positionType;
  if (input.status !== undefined) data.status = input.status;
  if (input.source !== undefined) data.source = input.source;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.interviewDate !== undefined) data.interviewDate = input.interviewDate ? new Date(input.interviewDate) : null;
  if (input.interviewNotes !== undefined) data.interviewNotes = input.interviewNotes;
  if (input.interviewedBy !== undefined) data.interviewedBy = input.interviewedBy;
  if (input.contractStatus !== undefined) data.contractStatus = input.contractStatus;
  if (input.contractSentAt !== undefined) data.contractSentAt = input.contractSentAt ? new Date(input.contractSentAt) : null;
  if (input.contractSignedAt !== undefined) data.contractSignedAt = input.contractSignedAt ? new Date(input.contractSignedAt) : null;

  if (input.cv) {
    data.cvFileName = input.cv.name;
    data.cvSize = input.cv.size ?? Buffer.from(input.cv.content, "base64").byteLength;
    data.cvUrl = `data:${input.cv.contentType || "application/octet-stream"};base64,${input.cv.content}`;
  }

  const updated = await prismadb.crm_Candidates.update({
    where: { id },
    data,
  });

  // Auto-log stage changes
  if (input.status) {
    await prismadb.crm_CandidateActivities.create({
      data: {
        candidateId: id,
        userId,
        type: "note",
        content: `Pipeline stage updated to: ${input.status}`,
      },
    });
  }

  return updated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteCandidate(id: string) {
  await requireAdmin();
  await prismadb.crm_Candidates.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function addCandidateActivity(
  candidateId: string,
  content: string,
  type: ActivityType = "note"
) {
  const { userId } = await requireAdmin();

  const activity = await prismadb.crm_CandidateActivities.create({
    data: { candidateId, userId, type, content },
  });

  return activity;
}

// ─── Wix Webhook Ingest ───────────────────────────────────────────────────────

export type WixCandidatePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  position?: string;
  positionType?: string;
  notes?: string;
  cvBase64?: string;
  cvFileName?: string;
  cvContentType?: string;
};

export async function ingestFromWix(payload: WixCandidatePayload, adminUserId: string) {
  let cvUrl: string | undefined;
  let cvFileName: string | undefined;
  let cvSize: number | undefined;

  if (payload.cvBase64) {
    cvFileName = payload.cvFileName || "cv.pdf";
    cvSize = Buffer.from(payload.cvBase64, "base64").byteLength;
    cvUrl = `data:${payload.cvContentType || "application/pdf"};base64,${payload.cvBase64}`;
  }

  const candidate = await prismadb.crm_Candidates.create({
    data: {
      createdById: adminUserId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      position: payload.position || "Not specified",
      positionType: payload.positionType || "Full-time",
      status: "Applied",
      source: "Wix Website",
      notes: payload.notes,
      cvUrl,
      cvFileName,
      cvSize,
    },
  });

  await prismadb.crm_CandidateActivities.create({
    data: {
      candidateId: candidate.id,
      userId: adminUserId,
      type: "note",
      content: `Application received via Wix website. Position: ${payload.position || "Not specified"}.`,
    },
  });

  return candidate;
}
