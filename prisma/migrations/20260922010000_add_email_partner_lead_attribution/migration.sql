-- Retain which email_partner originated a lead even after it is routed to
-- an RD/AD by postcode, and let a payment allocation reference a real
-- partner user instead of only a free-text name.
ALTER TABLE "crm_Leads" ADD COLUMN "assigned_email_partner_id" UUID;
CREATE INDEX "crm_Leads_assigned_email_partner_id_idx" ON "crm_Leads"("assigned_email_partner_id");

ALTER TABLE "crm_Members" ADD COLUMN "assigned_email_partner_id" UUID;

ALTER TABLE "crm_Payment_Allocations" ADD COLUMN "partner_user_id" UUID;
