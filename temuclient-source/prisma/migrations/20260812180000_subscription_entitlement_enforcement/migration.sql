CREATE TABLE "EntitlementUsage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntitlementUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EntitlementUsage_organizationId_feature_periodStart_entityId_key" ON "EntitlementUsage"("organizationId", "feature", "periodStart", "entityId");
CREATE INDEX "EntitlementUsage_organizationId_feature_periodStart_idx" ON "EntitlementUsage"("organizationId", "feature", "periodStart");
ALTER TABLE "EntitlementUsage" ADD CONSTRAINT "EntitlementUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
