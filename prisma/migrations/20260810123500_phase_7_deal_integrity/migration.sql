ALTER TABLE "Deal"
  ADD CONSTRAINT "Deal_probability_check" CHECK ("probability" BETWEEN 0 AND 100),
  ADD CONSTRAINT "Deal_estimatedValue_check" CHECK ("estimatedValue" IS NULL OR "estimatedValue" >= 0);

ALTER TABLE "Proposal"
  ADD CONSTRAINT "Proposal_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "Proposal_amount_check" CHECK ("amount" IS NULL OR "amount" >= 0);

-- Backfill accepted relationships created before Phase 7. IDs are deterministic and
-- opaque; all new application writes continue to use Prisma cuid() defaults.
INSERT INTO "Deal" (
  "id", "opportunityId", "buyerOrganizationId", "providerOrganizationId",
  "ownerUserId", "title", "stage", "status", "estimatedValue", "currency",
  "probability", "createdAt", "updatedAt"
)
SELECT
  'deal_' || substr(md5(i."id"), 1, 24),
  i."opportunityId",
  i."buyerOrganizationId",
  i."providerOrganizationId",
  i."requestedById",
  o."title",
  'INTRODUCTION'::"DealStage",
  'OPEN'::"DealStatus",
  o."budgetMax",
  o."currency",
  10,
  COALESCE(i."acceptedAt", i."updatedAt"),
  COALESCE(i."acceptedAt", i."updatedAt")
FROM "Introduction" i
JOIN "Opportunity" o ON o."id" = i."opportunityId"
LEFT JOIN "Deal" d
  ON d."opportunityId" = i."opportunityId"
 AND d."providerOrganizationId" = i."providerOrganizationId"
WHERE i."status" = 'ACCEPTED'::"IntroductionStatus"
  AND d."id" IS NULL
ON CONFLICT ("opportunityId", "providerOrganizationId") DO NOTHING;

INSERT INTO "DealStageHistory" (
  "id", "dealId", "fromStage", "toStage", "changedById", "createdAt"
)
SELECT
  'dsh_' || substr(md5(d."id"), 1, 24),
  d."id",
  NULL,
  'INTRODUCTION'::"DealStage",
  COALESCE(i."acceptedById", i."requestedById"),
  d."createdAt"
FROM "Deal" d
JOIN "Introduction" i
  ON i."opportunityId" = d."opportunityId"
 AND i."providerOrganizationId" = d."providerOrganizationId"
LEFT JOIN "DealStageHistory" h ON h."dealId" = d."id"
WHERE i."status" = 'ACCEPTED'::"IntroductionStatus"
  AND h."id" IS NULL
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "DealActivity" (
  "id", "dealId", "userId", "type", "title", "metadataJson", "occurredAt", "createdAt"
)
SELECT
  'activity_' || substr(md5(d."id"), 1, 20),
  d."id",
  i."requestedById",
  'SYSTEM'::"DealActivityType",
  'Deal dibuat dari Introduction yang diterima',
  jsonb_build_object('introductionId', i."id", 'backfilled', true),
  d."createdAt",
  d."createdAt"
FROM "Deal" d
JOIN "Introduction" i
  ON i."opportunityId" = d."opportunityId"
 AND i."providerOrganizationId" = d."providerOrganizationId"
LEFT JOIN "DealActivity" a ON a."dealId" = d."id"
WHERE i."status" = 'ACCEPTED'::"IntroductionStatus"
  AND a."id" IS NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "Conversation" c
SET "dealId" = d."id"
FROM "Introduction" i
JOIN "Deal" d
  ON d."opportunityId" = i."opportunityId"
 AND d."providerOrganizationId" = i."providerOrganizationId"
WHERE c."introductionId" = i."id"
  AND c."dealId" IS NULL;

UPDATE "Meeting" m
SET "dealId" = d."id"
FROM "Introduction" i
JOIN "Deal" d
  ON d."opportunityId" = i."opportunityId"
 AND d."providerOrganizationId" = i."providerOrganizationId"
WHERE m."introductionId" = i."id"
  AND m."dealId" IS NULL;
