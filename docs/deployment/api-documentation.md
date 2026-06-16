# NextCRM Inbound API Documentation

This document describes how external systems (Wix, payment portals, mobile apps) can push lead data into the NextCRM Central Operational Hub.

## Endpoint: Ingest Lead

**URL**: `https://crm.ukrba.org/api/v1/webhooks/wix-leads`  
**Method**: `POST`  
**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <YOUR_WEBHOOK_TOKEN>`

### Payload Structure

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `contact_name` | `string` | **Yes** | Full name of the contact. |
| `email` | `string` | **Yes** | Contact email address. |
| `lead_type` | `string` | **Yes** | Must be exactly: `SME Membership`, `White Label Partner`, `Corporate Partnership`, `Assessment Enquiry`, or `General Enquiry`. |
| `lead_source` | `string` | **Yes** | Origin of the lead (e.g. `Wix Website`, `App`, `Partner Portal`). |
| `business_name` | `string` | No | Registered business/company name. Defaults to `Self` if omitted. |
| `telephone` | `string` | No | Contact phone number. |
| `postcode` | `string` | No | Postal code (used for automatic regional assignment routing). |
| `website` | `string` | No | Company website URL. |

### Example Payload

```json
{
  "business_name": "Acme Corp Ltd",
  "contact_name": "Jane Doe",
  "telephone": "+447700900077",
  "email": "jane@acme.com",
  "website": "https://acme.com",
  "postcode": "EH12 5PP",
  "lead_type": "SME Membership",
  "lead_source": "Wix Contact Form"
}
```

### Responses

#### 201 Created (Success)
Returned when the lead is successfully accepted and saved in NextCRM.
```json
{
  "message": "Lead ingested successfully",
  "lead_id": "c8b417bb-e04f-40e1-bbca-7c87c97a51c4",
  "assigned_owner_id": "8c4598d9-23cf-4235-90cb-22df2252a13f"
}
```

#### 400 Bad Request
Returned if mandatory fields are missing or invalid parameters are provided.
```json
{
  "message": "Missing mandatory fields: contact_name, email, lead_type, and lead_source are required"
}
```

#### 401 Unauthorized
Returned if the `Authorization` token is missing or incorrect.
```json
{
  "message": "Unauthorized: Invalid credentials"
}
```
