-- CreateEnum
CREATE TYPE "IntroductionStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MATCH', 'INTRODUCTION_REQUESTED', 'INTRODUCTION_ACCEPTED', 'INTRODUCTION_DECLINED', 'MESSAGE', 'MEETING', 'PROPOSAL', 'OPPORTUNITY_UPDATED', 'VERIFICATION', 'DEAL_UPDATE', 'SYSTEM');

-- CreateTable
CREATE TABLE "Introduction" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "buyerOrganizationId" TEXT NOT NULL,
    "providerOrganizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "IntroductionStatus" NOT NULL DEFAULT 'REQUESTED',
    "message" TEXT,
    "fitSummary" TEXT,
    "proposedApproach" TEXT,
    "estimatedTimeline" TEXT,
    "declineReason" TEXT,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Introduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntroductionPortfolio" (
    "introductionId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntroductionPortfolio_pkey" PRIMARY KEY ("introductionId","portfolioId")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT,
    "introductionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conversationId","userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Introduction_buyerOrganizationId_status_idx" ON "Introduction"("buyerOrganizationId", "status");

-- CreateIndex
CREATE INDEX "Introduction_providerOrganizationId_status_idx" ON "Introduction"("providerOrganizationId", "status");

-- CreateIndex
CREATE INDEX "Introduction_opportunityId_status_idx" ON "Introduction"("opportunityId", "status");

-- CreateIndex
CREATE INDEX "Introduction_expiresAt_status_idx" ON "Introduction"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "IntroductionPortfolio_portfolioId_idx" ON "IntroductionPortfolio"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_introductionId_key" ON "Conversation"("introductionId");

-- CreateIndex
CREATE INDEX "Conversation_opportunityId_idx" ON "Conversation"("opportunityId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_lastReadAt_idx" ON "ConversationParticipant"("userId", "lastReadAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_organizationId_idx" ON "ConversationParticipant"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_buyerOrganizationId_fkey" FOREIGN KEY ("buyerOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_providerOrganizationId_fkey" FOREIGN KEY ("providerOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Introduction" ADD CONSTRAINT "Introduction_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntroductionPortfolio" ADD CONSTRAINT "IntroductionPortfolio_introductionId_fkey" FOREIGN KEY ("introductionId") REFERENCES "Introduction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntroductionPortfolio" ADD CONSTRAINT "IntroductionPortfolio_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_introductionId_fkey" FOREIGN KEY ("introductionId") REFERENCES "Introduction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
