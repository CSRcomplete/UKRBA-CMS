/**
 * test-wix-webhook.ts
 * ─────────────────────────────────────────────────────────────────────
 * Simulates Wix Automation webhook POST calls to the CRM lead ingestion
 * endpoint for all five lead categories.
 *
 * Usage (with dev server running on :3000):
 *   npx ts-node -P tsconfig.json --skip-project scripts/test-wix-webhook.ts
 *
 * You can target a deployed environment by setting:
 *   CRM_BASE_URL=https://crm.ukrba.org npx ts-node ...
 * ─────────────────────────────────────────────────────────────────────
 */

import * as dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.CRM_BASE_URL || "http://localhost:3000";
const TOKEN = process.env.WIX_WEBHOOK_TOKEN || "secure_token_123456";
const ENDPOINT = `${BASE_URL}/api/v1/webhooks/wix-leads`;

// ─── Colour helpers ───────────────────────────────────────────────────
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red   = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan  = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold  = (s: string) => `\x1b[1m${s}\x1b[0m`;

// ─── Test cases ───────────────────────────────────────────────────────
/**
 * Each test represents one Wix Automation trigger.
 *
 * The two plan-based triggers (SME Membership / White Label Partner) send
 * the nested `contact` + `plan_title` structure exactly as Wix does.
 *
 * The three form-based triggers (Corporate Partnership, Assessment Enquiry,
 * General Enquiry) send flat contact fields with an explicit `lead_type`.
 */
const tests: Array<{
  label: string;
  expectedLeadType: string;
  payload: Record<string, unknown>;
}> = [
  // ── 1. SME Membership (Pricing Plan purchase) ────────────────────────
  {
    label: "SME Membership — Pricing Plan purchase (with postcode)",
    expectedLeadType: "SME Membership",
    payload: {
      plan_title: "SME Starter Membership",
      plan_description: "Annual SME membership for small businesses",
      plan_price: { amount: "499.00", currency: "GBP" },
      plan_start_date_iso: "2026-06-16T09:00:00.000Z",
      plan_valid_until_iso: "2027-06-16T09:00:00.000Z",
      site_name: "UKRBA",
      site_email: "info@ukrba.org",
      contact_id: "wix-contact-001",
      contact: {
        name: { first: "James", last: "Mitchell" },
        email: "james.mitchell@example.com",
        company: "Mitchell Consulting Ltd",
        phone: "07700900001",
        address: {
          postalCode: "B1 1AA",
        },
      },
    },
  },

  // ── 2. SME Membership — no postcode (ops director fallback) ──────────
  {
    label: "SME Membership — no postcode (ops director fallback)",
    expectedLeadType: "SME Membership",
    payload: {
      plan_title: "SME Professional Membership",
      contact: {
        name: { first: "Sarah", last: "Owen" },
        email: "sarah.owen@techstart.co.uk",
        company: "TechStart Solutions",
        phone: "07700900002",
      },
    },
  },

  // ── 3. White Label Partner (Pricing Plan purchase) ───────────────────
  {
    label: "White Label Partner — Pricing Plan purchase",
    expectedLeadType: "White Label Partner",
    payload: {
      plan_title: "White Label Partner Programme",
      plan_description: "Partner reseller programme",
      plan_price: { amount: "1200.00", currency: "GBP" },
      contact: {
        name: { first: "David", last: "Park" },
        email: "david.park@partnerco.com",
        company: "Partner Co International",
        phone: "07700900003",
        address: {
          postalCode: "EC1A 1BB",
        },
      },
    },
  },

  // ── 4. Corporate Partnership (Wix form submission) ───────────────────
  {
    label: "Corporate Partnership — Wix form submission",
    expectedLeadType: "Corporate Partnership",
    payload: {
      contact_name: "Aisha Patel",
      email: "aisha.patel@corporatecorp.com",
      telephone: "07700900004",
      business_name: "CorporateCorp PLC",
      website: "https://corporatecorp.com",
      postcode: "M1 1AE",
      lead_type: "Corporate Partnership",
      lead_source: "Wix Website",
    },
  },

  // ── 5. Assessment Enquiry (Wix form submission) ───────────────────────
  {
    label: "Assessment Enquiry — Wix form submission",
    expectedLeadType: "Assessment Enquiry",
    payload: {
      contact_name: "Tom Harris",
      email: "tom.harris@business.co.uk",
      telephone: "07700900005",
      business_name: "Harris & Sons Ltd",
      postcode: "LS1 1BA",
      lead_type: "Assessment Enquiry",
      lead_source: "Wix Website",
    },
  },

  // ── 6. General Enquiry (Wix form submission) ──────────────────────────
  {
    label: "General Enquiry — Wix form submission (no postcode)",
    expectedLeadType: "General Enquiry",
    payload: {
      contact_name: "Lisa Nguyen",
      email: "lisa.nguyen@gmail.com",
      lead_type: "General Enquiry",
      lead_source: "Wix Website",
    },
  },
];

// ─── Runner ───────────────────────────────────────────────────────────
async function runTests() {
  console.log(bold(`\n🔗 Target: ${ENDPOINT}`));
  console.log(bold(`🔑 Token:  ${TOKEN.substring(0, 8)}${"*".repeat(TOKEN.length - 8)}\n`));
  console.log("═".repeat(70));

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${cyan(`[${i + 1}/${tests.length}]`)} ${bold(test.label)}`);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(test.payload),
      });

      const json: any = await res.json();

      if (res.status === 201) {
        const actualType = json.lead_type || "(not returned)";
        const typeMatch   = actualType === test.expectedLeadType;

        if (typeMatch) {
          console.log(green(`  ✅ PASS  HTTP ${res.status}`));
          console.log(`     Lead ID   : ${json.lead_id}`);
          console.log(`     Lead Type : ${actualType}`);
          console.log(`     Lead Source: ${json.lead_source || "(not returned)"}`);
          console.log(`     Owner ID  : ${json.assigned_owner_id || "(unassigned)"}`);
          passed++;
        } else {
          console.log(red(`  ❌ FAIL  HTTP ${res.status} — wrong lead_type`));
          console.log(`     Expected  : ${test.expectedLeadType}`);
          console.log(`     Got       : ${actualType}`);
          console.log(`     Full body : ${JSON.stringify(json)}`);
          failed++;
        }
      } else {
        console.log(red(`  ❌ FAIL  HTTP ${res.status}`));
        console.log(`     Response  : ${JSON.stringify(json)}`);
        failed++;
      }
    } catch (err: any) {
      console.log(red(`  ❌ ERROR  ${err.message}`));
      console.log(`     (Is the dev server running at ${BASE_URL}?)`);
      failed++;
    }

    // Small delay to avoid hammering
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("\n" + "═".repeat(70));
  console.log(bold(`\nResults: ${green(`${passed} passed`)}  ${failed > 0 ? red(`${failed} failed`) : `0 failed`}\n`));
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
