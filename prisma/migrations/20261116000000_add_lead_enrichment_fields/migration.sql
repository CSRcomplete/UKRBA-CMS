-- Prospect enrichment columns on crm_Leads (e.g. Kevin's merged contact list).
ALTER TABLE "crm_Leads"
  ADD COLUMN IF NOT EXISTS "personalEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "personAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "seniority" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "profileSummary" TEXT,
  ADD COLUMN IF NOT EXISTS "companyLinkedinUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "industry" TEXT,
  ADD COLUMN IF NOT EXISTS "companySummary" TEXT,
  ADD COLUMN IF NOT EXISTS "employeeCount" TEXT,
  ADD COLUMN IF NOT EXISTS "companyAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "companyCity" TEXT,
  ADD COLUMN IF NOT EXISTS "companyEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "facebook" TEXT,
  ADD COLUMN IF NOT EXISTS "annualRevenue" TEXT;
