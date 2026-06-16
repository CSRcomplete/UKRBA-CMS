/**
 * Reference Wix Velo Backend Code for NextCRM Ingestion
 * Place this code in your Wix site's backend files (e.g. events.js or a backend web module).
 * Make sure to define the WIX_WEBHOOK_TOKEN secret in your Wix Secrets Manager.
 */

import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

const NEXTCRM_API_URL = "https://crm.ukrba.org/api/v1/webhooks/wix-leads";

/**
 * Dispatches form submission payload to NextCRM
 * @param {Object} formData
 * @param {string} leadType - 'SME Membership' | 'White Label Partner' | 'Corporate Partnership' | 'Assessment Enquiry' | 'General Enquiry'
 * @param {string} leadSource - e.g. 'Wix Website'
 */
export async function sendLeadToCRM(formData, leadType, leadSource = 'Wix Website') {
  try {
    const webhookToken = await getSecret("WIX_WEBHOOK_TOKEN");
    
    const payload = {
      business_name: formData.businessName || formData.company || "",
      contact_name: formData.fullName || formData.name || "",
      telephone: formData.phone || formData.telephone || "",
      email: formData.email || "",
      website: formData.website || "",
      postcode: formData.postcode || "",
      lead_type: leadType,
      lead_source: leadSource
    };

    const response = await fetch(NEXTCRM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CRM webhook failed with status ${response.status}: ${errorText}`);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log("Lead successfully sent to CRM:", result);
    return { success: true, data: result };

  } catch (error) {
    console.error("Error sending lead to NextCRM:", error);
    return { success: false, error: error.message };
  }
}
