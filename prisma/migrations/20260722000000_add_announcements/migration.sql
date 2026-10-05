-- CreateTable
CREATE TABLE "crm_Announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Company News',
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "attachmentSize" INTEGER,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "crm_Announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_Announcements_authorId_idx" ON "crm_Announcements"("authorId");

-- CreateIndex
CREATE INDEX "crm_Announcements_category_idx" ON "crm_Announcements"("category");

-- CreateIndex
CREATE INDEX "crm_Announcements_isPinned_idx" ON "crm_Announcements"("isPinned");

-- CreateIndex
CREATE INDEX "crm_Announcements_createdAt_idx" ON "crm_Announcements"("createdAt");

-- CreateIndex
CREATE INDEX "crm_Announcements_deletedAt_idx" ON "crm_Announcements"("deletedAt");

-- AddForeignKey
ALTER TABLE "crm_Announcements" ADD CONSTRAINT "crm_Announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
