-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "ProviderAvailability" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "PortfolioStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "availability" "ProviderAvailability",
ADD COLUMN     "companySize" INTEGER,
ADD COLUMN     "teamCapacity" INTEGER;

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationService" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceCategoryId" TEXT NOT NULL,
    "description" TEXT,
    "minProjectValue" BIGINT,
    "maxProjectValue" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "typicalDurationMin" INTEGER,
    "typicalDurationMax" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationIndustry" (
    "organizationId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "experienceLevel" "ExperienceLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationIndustry_pkey" PRIMARY KEY ("organizationId","industryId")
);

-- CreateTable
CREATE TABLE "Technology" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clientName" TEXT,
    "isClientConfidential" BOOLEAN NOT NULL DEFAULT false,
    "industryId" TEXT,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "outcome" TEXT,
    "projectValueMin" BIGINT,
    "projectValueMax" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "durationMonths" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "PortfolioStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioTechnology" (
    "portfolioId" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,

    CONSTRAINT "PortfolioTechnology_pkey" PRIMARY KEY ("portfolioId","technologyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_isActive_sortOrder_idx" ON "ServiceCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ServiceCategory_parentId_idx" ON "ServiceCategory"("parentId");

-- CreateIndex
CREATE INDEX "OrganizationService_organizationId_idx" ON "OrganizationService"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationService_serviceCategoryId_idx" ON "OrganizationService"("serviceCategoryId");

-- CreateIndex
CREATE INDEX "OrganizationService_minProjectValue_idx" ON "OrganizationService"("minProjectValue");

-- CreateIndex
CREATE INDEX "OrganizationService_maxProjectValue_idx" ON "OrganizationService"("maxProjectValue");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationService_organizationId_serviceCategoryId_key" ON "OrganizationService"("organizationId", "serviceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_slug_key" ON "Industry"("slug");

-- CreateIndex
CREATE INDEX "Industry_isActive_sortOrder_idx" ON "Industry"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Industry_parentId_idx" ON "Industry"("parentId");

-- CreateIndex
CREATE INDEX "OrganizationIndustry_industryId_idx" ON "OrganizationIndustry"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "Technology_slug_key" ON "Technology"("slug");

-- CreateIndex
CREATE INDEX "Portfolio_organizationId_idx" ON "Portfolio"("organizationId");

-- CreateIndex
CREATE INDEX "Portfolio_industryId_idx" ON "Portfolio"("industryId");

-- CreateIndex
CREATE INDEX "Portfolio_completedAt_idx" ON "Portfolio"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_organizationId_slug_key" ON "Portfolio"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "PortfolioTechnology_technologyId_idx" ON "PortfolioTechnology"("technologyId");

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationService" ADD CONSTRAINT "OrganizationService_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationService" ADD CONSTRAINT "OrganizationService_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationIndustry" ADD CONSTRAINT "OrganizationIndustry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationIndustry" ADD CONSTRAINT "OrganizationIndustry_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioTechnology" ADD CONSTRAINT "PortfolioTechnology_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioTechnology" ADD CONSTRAINT "PortfolioTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
