-- CreateTable
CREATE TABLE "OpportunityMatch" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "serviceScore" INTEGER NOT NULL,
    "industryScore" INTEGER NOT NULL,
    "budgetScore" INTEGER NOT NULL,
    "portfolioScore" INTEGER NOT NULL,
    "technologyScore" INTEGER NOT NULL,
    "capacityScore" INTEGER NOT NULL,
    "locationScore" INTEGER NOT NULL,
    "availabilityScore" INTEGER NOT NULL,
    "reasonsJson" JSONB NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOpportunity" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "savedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityMatch_opportunityId_totalScore_idx" ON "OpportunityMatch"("opportunityId", "totalScore" DESC);

-- CreateIndex
CREATE INDEX "OpportunityMatch_providerOrganizationId_totalScore_idx" ON "OpportunityMatch"("providerOrganizationId", "totalScore" DESC);

-- CreateIndex
CREATE INDEX "OpportunityMatch_algorithmVersion_calculatedAt_idx" ON "OpportunityMatch"("algorithmVersion", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityMatch_opportunityId_providerOrganizationId_key" ON "OpportunityMatch"("opportunityId", "providerOrganizationId");

-- CreateIndex
CREATE INDEX "SavedOpportunity_organizationId_createdAt_idx" ON "SavedOpportunity"("organizationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SavedOpportunity_savedById_idx" ON "SavedOpportunity"("savedById");

-- CreateIndex
CREATE UNIQUE INDEX "SavedOpportunity_opportunityId_organizationId_key" ON "SavedOpportunity"("opportunityId", "organizationId");

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_providerOrganizationId_fkey" FOREIGN KEY ("providerOrganizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
