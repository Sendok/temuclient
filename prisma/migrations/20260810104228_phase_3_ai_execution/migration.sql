-- CreateTable
CREATE TABLE "AIExecution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "cost" DECIMAL(65,30),
    "status" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIExecution_organizationId_feature_createdAt_idx" ON "AIExecution"("organizationId", "feature", "createdAt");

-- CreateIndex
CREATE INDEX "AIExecution_userId_createdAt_idx" ON "AIExecution"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
