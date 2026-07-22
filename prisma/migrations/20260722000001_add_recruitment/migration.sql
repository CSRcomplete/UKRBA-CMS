-- CreateTable
CREATE TABLE "crm_Candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "position" TEXT NOT NULL,
    "positionType" TEXT NOT NULL DEFAULT 'Full-time',
    "status" TEXT NOT NULL DEFAULT 'Applied',
    "cvUrl" TEXT,
    "cvFileName" TEXT,
    "cvSize" INTEGER,
    "interviewDate" TIMESTAMP(3),
    "interviewNotes" TEXT,
    "interviewedBy" TEXT,
    "contractStatus" TEXT NOT NULL DEFAULT 'None',
    "contractSentAt" TIMESTAMP(3),
    "contractSignedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'Manual',
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "crm_Candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_CandidateActivities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_CandidateActivities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_Candidates_status_idx" ON "crm_Candidates"("status");
CREATE INDEX "crm_Candidates_position_idx" ON "crm_Candidates"("position");
CREATE INDEX "crm_Candidates_email_idx" ON "crm_Candidates"("email");
CREATE INDEX "crm_Candidates_createdById_idx" ON "crm_Candidates"("createdById");
CREATE INDEX "crm_Candidates_createdAt_idx" ON "crm_Candidates"("createdAt");
CREATE INDEX "crm_Candidates_deletedAt_idx" ON "crm_Candidates"("deletedAt");

CREATE INDEX "crm_CandidateActivities_candidateId_idx" ON "crm_CandidateActivities"("candidateId");
CREATE INDEX "crm_CandidateActivities_userId_idx" ON "crm_CandidateActivities"("userId");
CREATE INDEX "crm_CandidateActivities_createdAt_idx" ON "crm_CandidateActivities"("createdAt");

-- AddForeignKey
ALTER TABLE "crm_Candidates" ADD CONSTRAINT "crm_Candidates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_CandidateActivities" ADD CONSTRAINT "crm_CandidateActivities_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "crm_Candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_CandidateActivities" ADD CONSTRAINT "crm_CandidateActivities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
