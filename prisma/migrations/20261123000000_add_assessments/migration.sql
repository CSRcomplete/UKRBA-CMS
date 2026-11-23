-- 5GBP / free assessments submitted on the Wix site, linked to the owning lead so its
-- RD and AD can see the answers and the generated report link.
CREATE TABLE "crm_Assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submission_id" TEXT NOT NULL,
    "lead_id" UUID,
    "assessment_type" TEXT NOT NULL DEFAULT '5GBP Free Assessment',
    "business_name" TEXT,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "postcode" TEXT,
    "website" TEXT,
    "membership_number" TEXT,
    "referred_by" TEXT,
    "answers" JSONB,
    "report_url" TEXT,
    "report_status" TEXT NOT NULL DEFAULT 'pending',
    "report_ready_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_Assessments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_Assessments_submission_id_key" ON "crm_Assessments"("submission_id");
CREATE INDEX "crm_Assessments_lead_id_idx" ON "crm_Assessments"("lead_id");
CREATE INDEX "crm_Assessments_email_idx" ON "crm_Assessments"("email");
CREATE INDEX "crm_Assessments_submitted_at_idx" ON "crm_Assessments"("submitted_at");

ALTER TABLE "crm_Assessments" ADD CONSTRAINT "crm_Assessments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_Leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
