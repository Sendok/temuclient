CREATE TABLE "RiskFlag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "opportunityId" TEXT,
    "signal" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "metadataJson" JSONB,
    "createdById" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RiskFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RiskFlag_organizationId_resolvedAt_createdAt_idx" ON "RiskFlag"("organizationId", "resolvedAt", "createdAt");
CREATE INDEX "RiskFlag_opportunityId_resolvedAt_createdAt_idx" ON "RiskFlag"("opportunityId", "resolvedAt", "createdAt");
CREATE INDEX "RiskFlag_severity_resolvedAt_createdAt_idx" ON "RiskFlag"("severity", "resolvedAt", "createdAt");

ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
