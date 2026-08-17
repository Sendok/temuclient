-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'MATCHING', 'IN_DISCUSSION', 'WON', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OpportunityIntentLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('NEW_DEVELOPMENT', 'SYSTEM_REPLACEMENT', 'SYSTEM_INTEGRATION', 'CONSULTING', 'MANAGED_SERVICE', 'OUTSOURCING', 'AUDIT', 'IMPLEMENTATION', 'MIGRATION');

-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('MUST_HAVE', 'SHOULD_HAVE', 'NICE_TO_HAVE');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('ESTIMATED', 'APPROVED', 'FLEXIBLE', 'UNDISCLOSED');

-- CreateEnum
CREATE TYPE "AttachmentVisibility" AS ENUM ('BUYER_ONLY', 'INTRODUCED_PROVIDER', 'PUBLIC_SUMMARY');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('COMPANY', 'DOMAIN', 'CONTACT', 'REQUIREMENT', 'BUDGET', 'DECISION_MAKER');

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "buyerOrganizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "serviceCategoryId" TEXT,
    "industryId" TEXT,
    "problemStatement" TEXT NOT NULL,
    "businessObjective" TEXT,
    "description" TEXT,
    "projectType" "ProjectType",
    "budgetMin" BIGINT,
    "budgetMax" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "budgetStatus" "BudgetStatus",
    "timelineStart" TIMESTAMP(3),
    "timelineEnd" TIMESTAMP(3),
    "country" TEXT NOT NULL DEFAULT 'Indonesia',
    "province" TEXT,
    "city" TEXT,
    "remoteAllowed" BOOLEAN NOT NULL DEFAULT true,
    "preferredProviderLocation" TEXT,
    "decisionMakerInvolved" BOOLEAN NOT NULL DEFAULT false,
    "intentScore" INTEGER NOT NULL DEFAULT 0,
    "intentLevel" "OpportunityIntentLevel" NOT NULL DEFAULT 'LOW',
    "intentAlgorithmVersion" TEXT NOT NULL DEFAULT 'buyer-intent-v1',
    "intentCalculatedAt" TIMESTAMP(3),
    "verificationLevel" INTEGER NOT NULL DEFAULT 0,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityRequirement" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "RequirementPriority" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityAttachment" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "visibility" "AttachmentVisibility" NOT NULL DEFAULT 'BUYER_ONLY',
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "opportunityId" TEXT,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "evidenceJson" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorOrganizationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadataJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_status_publishedAt_idx" ON "Opportunity"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Opportunity_serviceCategoryId_status_idx" ON "Opportunity"("serviceCategoryId", "status");

-- CreateIndex
CREATE INDEX "Opportunity_industryId_status_idx" ON "Opportunity"("industryId", "status");

-- CreateIndex
CREATE INDEX "Opportunity_city_status_idx" ON "Opportunity"("city", "status");

-- CreateIndex
CREATE INDEX "Opportunity_intentScore_idx" ON "Opportunity"("intentScore");

-- CreateIndex
CREATE INDEX "Opportunity_expiresAt_idx" ON "Opportunity"("expiresAt");

-- CreateIndex
CREATE INDEX "Opportunity_buyerOrganizationId_idx" ON "Opportunity"("buyerOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_buyerOrganizationId_slug_key" ON "Opportunity"("buyerOrganizationId", "slug");

-- CreateIndex
CREATE INDEX "OpportunityRequirement_opportunityId_idx" ON "OpportunityRequirement"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityRequirement_opportunityId_priority_idx" ON "OpportunityRequirement"("opportunityId", "priority");

-- CreateIndex
CREATE INDEX "OpportunityAttachment_opportunityId_idx" ON "OpportunityAttachment"("opportunityId");

-- CreateIndex
CREATE INDEX "Verification_organizationId_type_status_idx" ON "Verification"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "Verification_opportunityId_type_status_idx" ON "Verification"("opportunityId", "type", "status");

-- CreateIndex
CREATE INDEX "Verification_status_createdAt_idx" ON "Verification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_buyerOrganizationId_fkey" FOREIGN KEY ("buyerOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityRequirement" ADD CONSTRAINT "OpportunityRequirement_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityAttachment" ADD CONSTRAINT "OpportunityAttachment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityAttachment" ADD CONSTRAINT "OpportunityAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorOrganizationId_fkey" FOREIGN KEY ("actorOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
