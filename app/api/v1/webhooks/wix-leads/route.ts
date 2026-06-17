import { prismadb } from "@/lib/prisma";
import { logOwnershipChange } from "@/lib/ownership";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("content-type") !== "application/json") {
    return NextResponse.json({ message: "Invalid content-type" }, { status: 400 });
  }

  // 1. Authorization Token Check (supports Bearer header or ?token= query parameter)
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
    const rawBody = await req.json();
    console.log("INCOMING WIX WEBHOOK BODY:", JSON.stringify(rawBody, null, 2));

    // Support both raw body or wrapped Wix data body structure
    const body = rawBody.data ? rawBody.data : rawBody;

    // Normalise nested Wix Automations webhook payloads
    let contact_name = body.contact_name;
    let email = body.email;
    let telephone = body.telephone || body["telephone "]; // handle optional trailing spaces from Wix UI
    let business_name = body.business_name;
    let postcode = body.postcode || body.postcode_1;
    let website = body.website;
    let lead_type = body.lead_type;
    let lead_source = body.lead_source || "Wix Website";

    // Fallbacks for raw Wix event structure
    if (!contact_name) {
      if (body.contact?.name) {
        const nameObj = body.contact.name;
        if (typeof nameObj === 'object') {
          const first = nameObj.first || "";
          const last = nameObj.last || "";
          contact_name = `${first} ${last}`.trim() || null;
        } else if (typeof nameObj === 'string') {
          contact_name = nameObj;
        }
      } else if (body.buyer?.name) {
        contact_name = body.buyer.name;
      } else if (body.buyer?.firstName || body.buyer?.lastName) {
        contact_name = `${body.buyer.firstName || ""} ${body.buyer.lastName || ""}`.trim() || null;
      } else if (body.contact?.firstName || body.contact?.lastName) {
        contact_name = `${body.contact.firstName || ""} ${body.contact.lastName || ""}`.trim() || null;
      } else if (body.firstName || body.lastName) {
        contact_name = `${body.firstName || ""} ${body.lastName || ""}`.trim() || null;
      }
    }

    if (!email) {
      email = body.contact?.email || body.buyer?.email || body.emailAddress;
    }

    if (!telephone) {
      telephone = body.contact?.phone || body.buyer?.phone || body.phone || body.phoneNumber || body.contact?.telephone || body.telephone;
    }

    if (!business_name) {
      business_name = body.contact?.company || body.buyer?.company || body.company || body.businessName;
    }

    if (!postcode) {
      postcode = body.contact?.address?.postalCode || body.contact?.address?.zipCode || body.contact?.address?.formattedAddress || body.buyer?.address?.postalCode || body.buyer?.address?.zipCode || body.address?.postalCode || body.address?.zipCode || body.zipCode || body.postalCode || body.contact?.postcode_1 || body.buyer?.postcode_1 || body.address?.postcode_1;
    }

    if (!website) {
      website = body.contact?.website || body.buyer?.website || body.companyWebsite;
    }

    if (body.contact) {
      const contact = body.contact;
      
      // Resolve name
      if (!contact_name && contact.name) {
        if (typeof contact.name === 'object') {
          const first = contact.name.first || "";
          const last = contact.name.last || "";
          contact_name = `${first} ${last}`.trim() || null;
        } else if (typeof contact.name === 'string') {
          contact_name = contact.name;
        }
      }
      
      email = email || contact.email;
      telephone = telephone || contact.phone;
      business_name = business_name || contact.company;
      
      // Resolve address / postcode
      if (!postcode && contact.address) {
        postcode = contact.address.postalCode || contact.address.zipCode || contact.address.formattedAddress;
      }
      
      website = website || contact.website;
    }

    // Clean and normalise telephone number formats
    if (telephone) {
      // Remove all whitespaces, dashes, parentheses
      let cleanPhone = telephone.replace(/[\s\-\(\)]/g, "");
      
      // If phone got duplicated (e.g. +44123+44123), extract only the first match
      const duplicates = cleanPhone.match(/(\+?[0-9]{7,15})/);
      if (duplicates) {
        cleanPhone = duplicates[1];
      }

      // Convert UK +44 prefix to local 0
      if (cleanPhone.startsWith("+44")) {
        cleanPhone = "0" + cleanPhone.substring(3);
      } else if (cleanPhone.startsWith("44") && cleanPhone.length > 10) {
        cleanPhone = "0" + cleanPhone.substring(2);
      }
      
      telephone = cleanPhone;
    }

    // Determine lead type automatically based on Wix Plan ordered if not explicitly passed
    const rawPlanTitle = body.plan_title || body.planTitle || body.planName || body.order?.planName || body.order?.planTitle || body.plan?.name || body.plan?.title;
    if (!lead_type && rawPlanTitle) {
      const planTitle = rawPlanTitle.toLowerCase();
      if (planTitle.includes("white label") || planTitle.includes("partner")) {
        lead_type = "White Label Partner";
      } else {
        lead_type = "SME Membership";
      }
    }


    if (!contact_name || !email || !lead_type || !lead_source) {
      return NextResponse.json({ message: "Missing mandatory fields: contact_name, email, lead_type, and lead_source are required" }, { status: 400 });
    }

    const validLeadTypes = ['SME Membership', 'White Label Partner', 'Corporate Partnership', 'Assessment Enquiry', 'General Enquiry'];
    if (!validLeadTypes.includes(lead_type)) {
      return NextResponse.json({ message: "Invalid lead_type parameter" }, { status: 400 });
    }

    // Resolve lead_type_id from crm_Lead_Types lookup table
    const leadTypeRecord = await prismadb.crm_Lead_Types.findFirst({
      where: { name: lead_type }
    });
    const lead_type_id = leadTypeRecord?.id || null;

    // Resolve lead_source_id — upsert so "Wix Website" is auto-created if missing
    const leadSourceRecord = await prismadb.crm_Lead_Sources.upsert({
      where: { name: lead_source },
      create: { name: lead_source },
      update: {},
    });
    const lead_source_id = leadSourceRecord?.id || null;

    // Split name into firstName and lastName for NextCRM crm_Leads model compliance
    const names = (contact_name || "").trim().split(/\s+/);
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

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

    // Check for a recently created duplicate lead (within last 15 minutes) with the same email
    const existingLead = await prismadb.crm_Leads.findFirst({
      where: {
        email: email,
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000)
        }
      }
    });

    if (existingLead) {
      // Merge/update details (only overwrite if the incoming data is non-empty)
      const updatedLead = await prismadb.crm_Leads.update({
        where: { id: existingLead.id },
        data: {
          firstName: firstName || existingLead.firstName,
          lastName: lastName || existingLead.lastName,
          // If the existing company is "Self", allow overwriting with a real business name
          company: (business_name && business_name !== "Self") ? business_name : (existingLead.company || "Self"),
          phone: telephone || existingLead.phone,
          website: website || existingLead.website,
          postcode: postcode || existingLead.postcode,
          lead_type_id: lead_type_id || existingLead.lead_type_id,
          lead_source_id: lead_source_id || existingLead.lead_source_id,
          assigned_to: currentOwnerId || existingLead.assigned_to,
          assigned_partner_id: partnerId || existingLead.assigned_partner_id,
          assigned_area_director_id: areaDirectorId || existingLead.assigned_area_director_id,
          assigned_regional_director_id: regionalDirectorId || existingLead.assigned_regional_director_id,
          description: existingLead.description + ` | Additional info from Wix update (${lead_type})`
        }
      });

      // Write CDC Log manually for the update
      await prismadb.sys_audit_logs.create({
        data: {
          entity_type: "crm_Leads",
          entity_id: updatedLead.id,
          field_mutated: "ALL_UPDATE",
          new_value: JSON.stringify({ id: updatedLead.id, company: business_name, lead_type, lead_type_id, lead_source_id })
        }
      });

      return NextResponse.json({
        message: "Lead updated successfully (deduplicated)",
        lead_id: updatedLead.id,
        lead_type,
        lead_source,
        assigned_owner_id: updatedLead.assigned_to
      }, { status: 200 });
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
        website: website || null,
        postcode: postcode || null,
        lead_type_id,
        lead_source_id,
        assigned_to: currentOwnerId,
        assigned_partner_id: partnerId,
        assigned_area_director_id: areaDirectorId,
        assigned_regional_director_id: regionalDirectorId,
        description: `Wix Webhook Ingestion — ${lead_type} via ${lead_source}`
      }
    });

    // Log initial ownership history
    await logOwnershipChange({
      entityType: "lead",
      entityId: newLead.id,
      previousOwnerId: null,
      newOwnerId: currentOwnerId,
      areaDirectorId: areaDirectorId,
      regionalDirectorId: regionalDirectorId,
      changedById: null,
      changeReason: `Wix Webhook Ingestion (${lead_type}) - Postcode: ${postcode || "None"}`,
    });

    // Write CDC Log manually
    await prismadb.sys_audit_logs.create({
      data: {
        entity_type: "crm_Leads",
        entity_id: newLead.id,
        field_mutated: "ALL",
        new_value: JSON.stringify({ id: newLead.id, company: business_name, lead_type, lead_type_id, lead_source_id })
      }
    });

    return NextResponse.json({
      message: "Lead ingested successfully",
      lead_id: newLead.id,
      lead_type,
      lead_source,
      assigned_owner_id: currentOwnerId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Wix Webhook Ingest Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
