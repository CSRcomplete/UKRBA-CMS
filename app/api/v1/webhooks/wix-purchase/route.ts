import { prismadb } from "@/lib/prisma";
import { convertLeadToMember } from "@/actions/crm/leads/convert-lead-to-member";
import { resolveReferralOwner, referralOwnerToMemberFields } from "@/lib/referral-attribution";
import { SalesStatus } from "@prisma/client";
import { NextResponse } from "next/server";

function resolveSalesStatus(planName: string): SalesStatus {
  const p = planName.toLowerCase();
  if (p.includes("white label")) return "white_label";
  if (p.includes("premium")) return "premium";
  if (p.includes("accredited")) return "accredited";
  if (p.includes("verified")) return "verified";
  return "basic";
}

export async function POST(req: Request) {
  if (req.headers.get("content-type") !== "application/json") {
    return NextResponse.json({ message: "Invalid content-type. Expected application/json" }, { status: 400 });
  }

  // 1. Authorization Token Verification
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
    return NextResponse.json({ message: "Unauthorized: Missing authorization token" }, { status: 401 });
  }

  const secureToken = process.env.WIX_WEBHOOK_TOKEN || "secure_token_123456";
  if (token.trim() !== secureToken.trim()) {
    return NextResponse.json({ message: "Unauthorized: Invalid token credentials" }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    console.log("INCOMING WIX PRICING PLAN PURCHASE WEBHOOK:", JSON.stringify(rawBody, null, 2));

    const body = rawBody.data ? rawBody.data : rawBody;

    // Normalise fields from Wix Paid Plans / Velo events
    const email = (
      body.email ||
      body.buyer?.email ||
      body.contact?.email ||
      body.member?.email ||
      ""
    ).trim().toLowerCase();

    const planName = (
      body.plan_name ||
      body.plan_title ||
      body.planName ||
      body.planTitle ||
      body.package ||
      body.plan?.name ||
      body.plan?.title ||
      "SME Membership"
    ).trim();

    let contactName = (
      body.contact_name ||
      body.name ||
      body.buyer_name ||
      ""
    ).trim();

    if (!contactName && (body.buyer?.firstName || body.buyer?.lastName)) {
      contactName = `${body.buyer.firstName || ""} ${body.buyer.lastName || ""}`.trim();
    }

    if (!contactName && (body.contact?.firstName || body.contact?.lastName)) {
      contactName = `${body.contact.firstName || ""} ${body.contact.lastName || ""}`.trim();
    }

    const businessName = (body.business_name || body.company || body.Company || "").trim();
    const telephone = (body.telephone || body.phone || body.mobile || "").trim();
    const postcode = (body.postcode || body.postCode || "").trim();

    // /fsl/[slug] attribution — carried through Wix checkout as a coupon
    // code (simplest, no custom Wix code needed) or a custom field, so we
    // check several likely names for compatibility with however it's wired
    // up on the Wix side.
    const referralSlug = (
      body.couponCode ||
      body.coupon_code ||
      body.coupon?.code ||
      body.referral_slug ||
      body.referralSlug ||
      ""
    ).trim();

    if (!email && !contactName && !businessName) {
      return NextResponse.json({ message: "Missing buyer identification (email or name required)" }, { status: 400 });
    }

    // 2. Search for existing Lead by Email (or Postcode + Company)
    let matchingLead = null;

    if (email) {
      matchingLead = await prismadb.crm_Leads.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!matchingLead && postcode && businessName) {
      matchingLead = await prismadb.crm_Leads.findFirst({
        where: {
          postcode: { equals: postcode, mode: "insensitive" },
          company: { equals: businessName, mode: "insensitive" },
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // 3. If no matching lead found, create new lead (auto-routed by postcode)
    if (!matchingLead) {
      const now = new Date();
      let fName = "";
      let lName = contactName || "Lead";

      if (contactName) {
        const parts = contactName.split(" ");
        if (parts.length > 1) {
          fName = parts[0];
          lName = parts.slice(1).join(" ");
        } else {
          fName = contactName;
          lName = "Lead";
        }
      }

      // Ensure "SME Membership" lead type exists
      let leadTypeRecord = await prismadb.crm_Lead_Types.findUnique({
        where: { name: "SME Membership" },
      });
      if (!leadTypeRecord) {
        leadTypeRecord = await prismadb.crm_Lead_Types.create({
          data: { v: 0, name: "SME Membership" },
        });
      }

      matchingLead = await prismadb.crm_Leads.create({
        data: {
          v: 0,
          createdAt: now,
          updatedAt: now,
          firstName: fName || null,
          lastName: lName,
          company: businessName || null,
          email: email || null,
          phone: telephone || null,
          postcode: postcode || null,
          lead_type_id: leadTypeRecord.id,
        },
      });
    }

    // 4. Promote Lead -> Contact & Member, tagging the sales status (membership
    // tier) inferred from the purchased plan name rather than baking it into
    // the lead's pipeline status
    const result = await convertLeadToMember({
      leadId: matchingLead.id,
      planName: planName,
      salesStatus: resolveSalesStatus(planName),
      changeReason: `Wix Paid Plans online purchase (${planName})`,
    });

    if (result.error) {
      return NextResponse.json({ message: result.error }, { status: 500 });
    }

    // 5. Attribute the sale to whichever /fsl/[slug] link drove it, if any —
    // this can point the sale at a different owner than the lead's existing
    // postcode-based routing (e.g. an RD's own campaign link converting a
    // lead originally routed to a different Area Director).
    let attributedTo: string | null = null;
    if (referralSlug && result.member?.id) {
      try {
        const owner = await resolveReferralOwner(referralSlug);
        if (owner) {
          await prismadb.crm_Members.update({
            where: { id: result.member.id },
            data: {
              referral_source: referralSlug,
              ...referralOwnerToMemberFields(owner),
            },
          });
          attributedTo = owner.label;
        }
      } catch (attributionError) {
        console.error("WIX PURCHASE ATTRIBUTION ERROR:", attributionError);
        // Sale/conversion already succeeded above — attribution failure
        // shouldn't fail the whole webhook.
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully updated lead status to "${result.statusName}" and converted to Member.`,
        lead_id: matchingLead.id,
        contact_id: result.contact?.id,
        member_id: result.member?.id,
        status: result.statusName,
        attributed_to: attributedTo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("WIX PRICING PLANS WEBHOOK ERROR:", error);
    return NextResponse.json({ message: error.message || "Failed to process Wix purchase webhook" }, { status: 500 });
  }
}
