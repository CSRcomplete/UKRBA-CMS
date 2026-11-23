import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  leadReadScopeWhere,
  AuthenticationError,
} from "@/lib/authz";

const FULL_ACCESS_ROLES = ["admin", "ceo", "coo", "operations_director", "manager"];

export type AssessmentRow = {
  id: string;
  submittedAt: string;
  assessmentType: string;
  businessName: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  website: string | null;
  membershipNumber: string | null;
  answers: Record<string, unknown> | null;
  reportUrl: string | null;
  reportStatus: string;
  leadId: string | null;
  leadName: string | null;
  regionalDirector: string | null;
  areaDirector: string | null;
};

async function fetchAssessments(leadId?: string): Promise<AssessmentRow[]> {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  // Same visibility as leads: an RD/AD only sees assessments on leads they can read.
  // Unmatched assessments (no lead) are visible to full-access roles only.
  const where: any = FULL_ACCESS_ROLES.includes(user.role as string)
    ? {}
    : { lead: { is: await leadReadScopeWhere(user) } };
  if (leadId) where.lead_id = leadId;

  const rows = await prismadb.crm_Assessments.findMany({
    where,
    orderBy: { submitted_at: "desc" },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          assigned_regional_director_id: true,
          assigned_area_director_id: true,
        },
      },
    },
  });

  const userIds = Array.from(
    new Set(
      rows
        .flatMap((r) => [r.lead?.assigned_regional_director_id, r.lead?.assigned_area_director_id])
        .filter((v): v is string => !!v)
    )
  );
  const users = userIds.length
    ? await prismadb.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return rows.map((r) => ({
    id: r.id,
    submittedAt: r.submitted_at.toISOString(),
    assessmentType: r.assessment_type,
    businessName: r.business_name,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone,
    postcode: r.postcode,
    website: r.website,
    membershipNumber: r.membership_number,
    answers: (r.answers as Record<string, unknown> | null) ?? null,
    reportUrl: r.report_url,
    reportStatus: r.report_status,
    leadId: r.lead?.id ?? null,
    leadName: r.lead
      ? `${r.lead.firstName || ""} ${r.lead.lastName || ""}`.trim() || r.lead.company
      : null,
    regionalDirector: r.lead?.assigned_regional_director_id
      ? nameById.get(r.lead.assigned_regional_director_id) ?? null
      : null,
    areaDirector: r.lead?.assigned_area_director_id
      ? nameById.get(r.lead.assigned_area_director_id) ?? null
      : null,
  }));
}

export const getAssessments = cache(() => fetchAssessments());
export const getLeadAssessments = (leadId: string) => fetchAssessments(leadId);
