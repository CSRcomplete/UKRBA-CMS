# Wix Paid Plans Integration Guide

This guide explains how to connect your Wix Website's **Pricing Plans** to NextCRM so that whenever a customer purchases a membership plan online, NextCRM automatically updates their lead status to `"Subscribed - [Plan Name]"`, converts them into a **Contact** and **Member**, and preserves regional manager ownership.

---

## 1. Environment Secret Setup

In your Wix Dashboard:
1. Go to **Developer Tools** ➔ **Secrets Manager**.
2. Add a new Secret named `CRM_WEBHOOK_TOKEN` with your secret token value (must match `WIX_WEBHOOK_TOKEN` in your NextCRM `.env`).

---

## 2. Wix Velo Backend Event Code

In your Wix Site Code:
1. Go to **Backend Files** ➔ Add/Open `events.js`.
2. Paste the following snippet:

```javascript
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

const NEXTCRM_PURCHASE_URL = "https://crm.ukrba.org/api/v1/webhooks/wix-purchase";

/**
 * Fires automatically whenever a customer buys a Wix Pricing Plan
 */
export async function wixPaidPlans_onPlanPurchased(event) {
  try {
    const webhookToken = await getSecret("CRM_WEBHOOK_TOKEN");

    const payload = {
      email: event.order?.buyer?.email || event.order?.contact?.email || "",
      contact_name: event.order?.buyer?.name || `${event.order?.buyer?.firstName || ''} ${event.order?.buyer?.lastName || ''}`.trim(),
      plan_name: event.order?.planName || event.order?.planTitle || "SME Membership",
      telephone: event.order?.contact?.phone || "",
      business_name: event.order?.contact?.company || "",
      postcode: event.order?.contact?.postcode || ""
    };

    const response = await fetch(NEXTCRM_PURCHASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookToken}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log("NextCRM Paid Plan Purchase ingested successfully");
    } else {
      console.error("NextCRM webhook error status:", response.status);
    }
  } catch (err) {
    console.error("Error dispatching Wix purchase to NextCRM:", err);
  }
}
```

---

## 3. CRM Automatic Processing Flow

1. NextCRM receives the payload at `/api/v1/webhooks/wix-purchase`.
2. NextCRM searches `crm_Leads` for a matching email address.
3. Upon finding the lead:
   - Updates status to `"Subscribed - [Plan Name]"` (e.g. `Subscribed - SME Membership`, `Subscribed - 5GBP Purchase`).
   - Automatically creates a Contact in `crm_Contacts`.
   - Automatically creates an Active Member in `crm_Members`.
   - Retains original **Assigned To**, **Area Director**, and **Regional Director** so your regional sales team gets full credit.
