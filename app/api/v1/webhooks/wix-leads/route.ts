import { prismadb } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("content-type") !== "application/json") {
    return NextResponse.json({ message: "Invalid content-type" }, { status: 400 });
  }

  // 1. Authorization Bearer Token Check
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const secureToken = process.env.WIX_WEBHOOK_TOKEN || "secure_token_123456";

  if (token.trim() !== secureToken.trim()) {
    return NextResponse.json({ message: "Unauthorized: Invalid credentials" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { business_name, contact_name, telephone, email, website, postcode, lead_type, lead_source } = body;

    if (!contact_name || !email || !lead_type || !lead_source) {
      return NextResponse.json({ message: "Missing mandatory fields: contact_name, email, lead_type, and lead_source are required" }, { status: 400 });
    }

    const validLeadTypes = ['SME Membership', 'White Label Partner', 'Corporate Partnership', 'Assessment Enquiry', 'General Enquiry'];
    if (!validLeadTypes.includes(lead_type)) {
      return NextResponse.json({ message: "Invalid lead_type parameter" }, { status: 400 });
    }

    // Split name into firstName and lastName for NextCRM crm_Leads model compliance
    const names = contact_name.trim().split(/\s+/);
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "Unknown";

    // 2. Exception & Postcode Assignment Logic
    let currentOwnerId: string | null = null;
    let partnerId: string | null = null;
    let areaDirectorId: string | null = null;
    let regionalDirectorId: string | null = null;

    // Resolve Operations Director ID
    // Find a user with role = manager/admin or user where name contains Operations
    const opsDirector = await prismadb.users.findFirst({
      where: {
        OR: [
          { name: { contains: "Operations", mode: "insensitive" } },
          { email: { contains: "ops", mode: "insensitive" } }
        ]
      }
    });
    const opsDirectorId = opsDirector?.id || null;

    if (lead_type === 'White Label Partner') {
      currentOwnerId = opsDirectorId;
    } else if (lead_type === 'Corporate Partnership') {
      currentOwnerId = null; // Stays unassigned, visible to CEO/Ops
    } else if (postcode) {
      // Regular postcode allocation routing
      const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
      const prefixMatch = cleanPostcode.match(/^([A-Z]{1,2})/);
      const prefix = prefixMatch ? prefixMatch[1] : "";

      const routingRule = await prismadb.nextcrm_postcode_routing.findUnique({
        where: { postcode_area: prefix }
      });

      if (routingRule) {
        const assignedRegionId = routingRule.assigned_region_id;

        // Find active Area Director ID mapped to that region_id
        const areaDirector = await prismadb.users.findFirst({
          where: {
            region_id: assignedRegionId,
          }
        });

        if (areaDirector) {
          currentOwnerId = areaDirector.id;
          areaDirectorId = areaDirector.id;
          // Traverse up to find regional director parent
          if (areaDirector.parentId) {
            regionalDirectorId = areaDirector.parentId;
          }
        } else {
          currentOwnerId = opsDirectorId; // Fallback
        }
      } else {
        currentOwnerId = opsDirectorId; // Fallback
      }
    } else {
      currentOwnerId = opsDirectorId; // Fallback if no postcode provided
    }

    // Create the Lead record
    const newLead = await prismadb.crm_Leads.create({
      data: {
        v: 1,
        firstName,
        lastName,
        company: business_name || "Self",
        email,
        phone: telephone || null,
        postcode: postcode || null,
        assigned_to: currentOwnerId,
        assigned_partner_id: partnerId,
        assigned_area_director_id: areaDirectorId,
        assigned_regional_director_id: regionalDirectorId,
        description: `Source: ${lead_source} | Type: ${lead_type} | Website: ${website || "None"}`
      }
    });

    // Write CDC Log manually
    await prismadb.sys_audit_logs.create({
      data: {
        entity_type: "crm_Leads",
        entity_id: newLead.id,
        field_mutated: "ALL",
        new_value: JSON.stringify({ id: newLead.id, company: business_name, lead_type })
      }
    });

    return NextResponse.json({
      message: "Lead ingested successfully",
      lead_id: newLead.id,
      assigned_owner_id: currentOwnerId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Wix Webhook Ingest Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
