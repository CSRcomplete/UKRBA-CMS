import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { ingestFromWix, type WixCandidatePayload } from "@/actions/recruitment/recruitment";

/**
 * POST /api/recruitment/ingest
 *
 * Wix website webhook endpoint for accepting candidate applications.
 * Secure with shared secret header: X-Wix-Secret
 *
 * Expected JSON body:
 * {
 *   "firstName": "Jane",
 *   "lastName": "Doe",
 *   "email": "jane@example.com",
 *   "phone": "+44 7700 000000",
 *   "address": "London, UK",
 *   "position": "Business Development Manager",
 *   "positionType": "Full-time",
 *   "notes": "Referred by John Smith",
 *   "cvBase64": "<base64 encoded CV>",
 *   "cvFileName": "jane_doe_cv.pdf",
 *   "cvContentType": "application/pdf"
 * }
 */

export async function POST(req: NextRequest) {
  try {
    // Verify shared secret
    const secret = req.headers.get("x-wix-secret");
    const expectedSecret = process.env.WIX_WEBHOOK_SECRET;

    if (!expectedSecret) {
      return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json() as WixCandidatePayload;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, email" },
        { status: 400 }
      );
    }

    // Find the first admin user to attribute creation to
    const adminUser = await prismadb.users.findFirst({
      where: { role: { in: ["admin", "ceo"] }, userStatus: "ACTIVE" },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "No admin user found in system." }, { status: 500 });
    }

    const candidate = await ingestFromWix(body, adminUser.id);

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      message: `Candidate ${body.firstName} ${body.lastName} added to Recruitment Centre.`,
    });
  } catch (error) {
    console.error("[recruitment/ingest] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
