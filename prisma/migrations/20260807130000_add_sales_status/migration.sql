-- Sales Status (membership tier sold on a closed deal), kept separate from
-- the lead's working pipeline status and Lead Source.
CREATE TYPE "SalesStatus" AS ENUM ('basic', 'verified', 'accredited', 'premium', 'white_label');

ALTER TABLE "crm_Leads" ADD COLUMN "sales_status" "SalesStatus";
ALTER TABLE "crm_Contacts" ADD COLUMN "sales_status" "SalesStatus";
