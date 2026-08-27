import { prismadb } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Dedicated webhook for the "close an existing lead" £5 / Free Assessment links
 * (e.g. /rd/{slug}, /free-assessment-form/{slug}) that RDs/ADs send to leads
 * that are ALREADY in the CRM.
 *
 * This intentionally does NOT contain any owner/postcode routing logic —
 * unlike /api/v1/webhooks/wix-leads (new lead intake), a submission here must
 * NEVER change assigned_to / assigned_area_director_id / assigned_regional_director_id.
 * It only records that the assessment was completed on the matching existing lead.
 */
export async function POST(req: Request) {
  if (req.headers.get("content-type") !== "application/json") {
    return NextResponse.json({ message: "Invalid content-type" }, { status: 400 });
  }

  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");

  let token: string | null = null;
  if (queryToken) {
    token = queryToken;
  } else {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return NextResponse.json({ message: "Unauthorized: Missing token" }, { status: 401 });
  }

  const secureToken = process.env.WIX_WEBHOOK_TOKEN || "secure_token_123456";
  if (token.trim() !== secureToken.trim()) {
    return NextResponse.json({ message: "Unauthorized: Invalid credentials" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const email: string | undefined = body.email;
    const assessmentType: string | undefined = body.assessment_type; // "5gbp" | "free"

    if (!email) {
      return NextResponse.json({ message: "Missing mandatory field: email" }, { status: 400 });
    }
    if (assessmentType !== "5gbp" && assessmentType !== "free") {
      return NextResponse.json({ message: "assessment_type must be '5gbp' or 'free'" }, { status: 400 });
    }

    const completedAt = new Date();
    const dateField = assessmentType === "5gbp" ? "fivePoundAssessmentAt" : "freeAssessmentAt";
    const noteLabel = assessmentType === "5gbp" ? "5GBP Assessment" : "Free Assessment";

    // Match an existing lead by email only — never by name/postcode, and never
    // time-boxed, since this link is sent to leads that may already be weeks old.
    const existingLead = await prismadb.crm_Leads.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existingLead) {
      const updatedLead = await prismadb.crm_Leads.update({
        where: { id: existingLead.id },
        data: {
          [dateField]: completedAt,
          description: existingLead.description
            ? `${existingLead.description} | ${noteLabel} completed ${completedAt.toISOString()}`
            : `${noteLabel} completed ${completedAt.toISOString()}`,
          // Deliberately NOT touching: assigned_to, assigned_partner_id,
          // assigned_area_director_id, assigned_regional_director_id, lead_type_id.
        },
      });

      await prismadb.sys_audit_logs.create({
        data: {
          entity_type: "crm_Leads",
          entity_id: updatedLead.id,
          field_mutated: dateField,
          new_value: JSON.stringify({ id: updatedLead.id, [dateField]: completedAt }),
        },
      });

      return NextResponse.json({
        message: `${noteLabel} recorded on existing lead`,
        lead_id: updatedLead.id,
        matched: true,
      }, { status: 200 });
    }

    // No matching lead found. Per requirement, we must NEVER guess an owner here —
    // create it unassigned and flag it clearly for manual review rather than
    // silently dropping the submission.
    const names = (body.contact_name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "Unknown";

    const newLead = await prismadb.crm_Leads.create({
      data: {
        v: 1,
        firstName,
        lastName,
        company: body.business_name || "Self",
        email,
        phone: body.telephone || null,
        [dateField]: completedAt,
        assigned_to: null,
        assigned_area_director_id: null,
        assigned_regional_director_id: null,
        description: `⚠ ${noteLabel} link submitted but no matching existing lead was found for this email — needs manual review/assignment.`,
      },
    });

    await prismadb.sys_audit_logs.create({
      data: {
        entity_type: "crm_Leads",
        entity_id: newLead.id,
        field_mutated: "ALL",
        new_value: JSON.stringify({ id: newLead.id, [dateField]: completedAt, unmatched: true }),
      },
    });

    return NextResponse.json({
      message: `${noteLabel} link submitted — no existing lead matched this email, created unassigned for manual review`,
      lead_id: newLead.id,
      matched: false,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Wix Lead-Assessment Webhook Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
