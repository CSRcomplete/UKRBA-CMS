-- Tracks the AI-generated 3-step upsell email sequence sent to £5
-- Assessment leads, so RDs can see what's been sent and whether the
-- customer converted, without exposing this to other RDs' leads.
CREATE TYPE "crm_LeadEmailFlowStatus" AS ENUM ('in_progress', 'customer_bought', 'completed_no_purchase');

CREATE TABLE "crm_LeadEmailFlow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "status" "crm_LeadEmailFlowStatus" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_LeadEmailFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_LeadEmailFlowStep" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flow_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "crm_LeadEmailFlowStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "crm_LeadEmailFlow_lead_id_idx" ON "crm_LeadEmailFlow"("lead_id");
CREATE INDEX "crm_LeadEmailFlow_status_idx" ON "crm_LeadEmailFlow"("status");

CREATE UNIQUE INDEX "crm_LeadEmailFlowStep_flow_id_step_number_key" ON "crm_LeadEmailFlowStep"("flow_id", "step_number");
CREATE INDEX "crm_LeadEmailFlowStep_flow_id_idx" ON "crm_LeadEmailFlowStep"("flow_id");

ALTER TABLE "crm_LeadEmailFlow" ADD CONSTRAINT "crm_LeadEmailFlow_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_Leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_LeadEmailFlowStep" ADD CONSTRAINT "crm_LeadEmailFlowStep_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "crm_LeadEmailFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
