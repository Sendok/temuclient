CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'CANCELLED');

CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "createdById" TEXT,
    "plan" "SubscriptionPlan" NOT NULL,
    "billingPeriodMonths" INTEGER NOT NULL DEFAULT 1,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "method" TEXT NOT NULL DEFAULT 'QRIS',
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "qrisImageUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionPayment_providerOrderId_key" ON "SubscriptionPayment"("providerOrderId");
CREATE UNIQUE INDEX "SubscriptionPayment_providerTransactionId_key" ON "SubscriptionPayment"("providerTransactionId");
CREATE INDEX "SubscriptionPayment_organizationId_status_createdAt_idx" ON "SubscriptionPayment"("organizationId", "status", "createdAt");
CREATE INDEX "SubscriptionPayment_status_expiresAt_idx" ON "SubscriptionPayment"("status", "expiresAt");

ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
