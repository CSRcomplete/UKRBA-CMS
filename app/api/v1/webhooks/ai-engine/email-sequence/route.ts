import { prismadb } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");

  let token: string | null = queryToken;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return NextResponse.json({ message: "Unauthorized: Missing authorization token" }, { status: 401 });
  }

  const secureToken = process.env.AI_ENGINE_WEBHOOK_TOKEN || "secure_token_123456";
  if (token.trim() !== secureToken.trim()) {
    return NextResponse.json({ message: "Unauthorized: Invalid token credentials" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ message: "Missing buyer email" }, { status: 400 });
    }

    const email1Subject = body.email1Subject;
    const email1Body = body.email1Body;
    const email2Subject = body.email2Subject;
    const email2Body = body.email2Body;
    const email3Subject = body.email3Subject;
    const email3Body = body.email3Body;

    if (!email1Subject || !email1Body || !email2Subject || !email2Body || !email3Subject || !email3Body) {
      return NextResponse.json({ message: "Missing one or more generated email subjects/bodies" }, { status: 400 });
    }

    const matchingLead = await prismadb.crm_Leads.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!matchingLead) {
      return NextResponse.json({ message: `No matching lead found for email ${email}` }, { status: 404 });
    }

    // Avoid creating a duplicate sequence if this webhook is retried
    const existingActiveFlow = await prismadb.crm_LeadEmailFlow.findFirst({
      where: { lead_id: matchingLead.id, status: "in_progress" },
    });
    if (existingActiveFlow) {
      return NextResponse.json({
        message: "An email flow is already in progress for this lead",
        flow_id: existingActiveFlow.id,
      });
    }

    const flow = await prismadb.crm_LeadEmailFlow.create({
      data: {
        lead_id: matchingLead.id,
        status: "in_progress",
        steps: {
          create: [
            { step_number: 1, subject: email1Subject, body: email1Body },
            { step_number: 2, subject: email2Subject, body: email2Body },
            { step_number: 3, subject: email3Subject, body: email3Body },
          ],
        },
      },
    });

    await inngest.send({
      name: "leads/email-flow-start",
      data: { flowId: flow.id },
    });

    return NextResponse.json({ success: true, flow_id: flow.id, lead_id: matchingLead.id }, { status: 201 });
  } catch (error: any) {
    console.error("AI ENGINE EMAIL SEQUENCE WEBHOOK ERROR:", error);
    return NextResponse.json({ message: error.message || "Failed to process AI engine email sequence webhook" }, { status: 500 });
  }
}
