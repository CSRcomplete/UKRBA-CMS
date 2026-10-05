-- Public, tokenized download links for large email attachments that can't
-- be sent inline (SMTP/provider size limits). Served by /api/dl/[token].
CREATE TABLE "SharedFileLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdById" UUID,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedFileLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SharedFileLink_token_key" ON "SharedFileLink"("token");
