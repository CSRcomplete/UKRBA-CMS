-- CreateTable
CREATE TABLE "crm_Ownership_History" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "previous_owner_id" UUID,
    "new_owner_id" UUID,
    "area_director_id" UUID,
    "regional_director_id" UUID,
    "changed_by_id" UUID,
    "change_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_Ownership_History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_Ownership_History_entity_id_idx" ON "crm_Ownership_History"("entity_id");

-- CreateIndex
CREATE INDEX "crm_Ownership_History_entity_type_entity_id_idx" ON "crm_Ownership_History"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "crm_Ownership_History" ADD CONSTRAINT "crm_Ownership_History_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
