import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true";

describe.skipIf(!runDatabaseTests)("Phase 10 billing, analytics, health, rate limits, and file privacy", async () => {
  const { db } = await import("../../src/server/db/client");
  const { processBillingWebhook } = await import("../../src/modules/billing/service");
  const { getFunnelMetrics, trackAnalyticsEvent } = await import("../../src/modules/analytics/service");
  const { getAuthorizedAttachment } = await import("../../src/modules/storage/permissions");
  const { enforceFeatureRateLimit } = await import("../../src/server/auth/rate-limit");
  const { sendTransactionalEmail } = await import("../../src/modules/email/provider");
  const { createPresignedUpload } = await import("../../src/modules/storage/service");
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let buyer: { id: string }; let provider: { id: string }; let buyerUser: { id: string }; let attachmentId = "";

  beforeAll(async () => {
    buyerUser = await db.user.create({ data: { name: "Production Buyer", email: `production-buyer-${nonce}@example.test` } });
    buyer = await db.organization.create({ data: { name: "Production Buyer", slug: `production-buyer-${nonce}`, type: "BUYER" } });
    provider = await db.organization.create({ data: { name: "Production Provider", slug: `production-provider-${nonce}`, type: "PROVIDER" } });
    const opportunity = await db.opportunity.create({ data: { buyerOrganizationId: buyer.id, title: "Private launch requirement", slug: `private-launch-${nonce}`, problemStatement: "Private requirement used to prove the production attachment boundary.", createdById: buyerUser.id } });
    const attachment = await db.opportunityAttachment.create({ data: { opportunityId: opportunity.id, name: "private.pdf", storageKey: `${buyer.id}/opportunity_attachment/${opportunity.id}/private.pdf`, mimeType: "application/pdf", size: 100, visibility: "BUYER_ONLY", uploadedById: buyerUser.id } });
    attachmentId = attachment.id;
  });

  afterAll(async () => {
    await db.billingWebhookEvent.deleteMany({ where: { providerEventId: { startsWith: `evt-${nonce}` } } });
    await db.analyticsEvent.deleteMany({ where: { organizationId: { in: [buyer.id, provider.id] } } });
    await db.auditLog.deleteMany({ where: { actorOrganizationId: { in: [buyer.id, provider.id] } } });
    await db.opportunity.deleteMany({ where: { buyerOrganizationId: buyer.id } });
    await db.organization.deleteMany({ where: { id: { in: [buyer.id, provider.id] } } });
    await db.user.delete({ where: { id: buyerUser.id } }); await db.$disconnect();
  });

  it("processes billing webhook idempotently", async () => {
    const input = { id: `evt-${nonce}`, type: "subscription.updated" as const, data: { organizationId: provider.id, plan: "PRO" as const, status: "ACTIVE" as const, cancelAtPeriodEnd: false } };
    const raw = JSON.stringify(input);
    expect((await processBillingWebhook("sandbox", raw, input)).duplicate).toBe(false);
    expect((await processBillingWebhook("sandbox", raw, input)).duplicate).toBe(true);
    expect(await db.subscription.findUnique({ where: { organizationId: provider.id } })).toMatchObject({ plan: "PRO", status: "ACTIVE" });
  });

  it("tracks the launch funnel and North Star", async () => {
    const now = new Date();
    await trackAnalyticsEvent({ name: "introduction_accepted", organizationId: buyer.id, entityType: "Introduction", entityId: `intro-${nonce}` });
    const metrics = await getFunnelMetrics(new Date(now.getTime() - 60_000), new Date(now.getTime() + 60_000));
    expect(metrics.qualifiedIntroductions).toBeGreaterThanOrEqual(1);
  });

  it("denies private buyer attachment to a provider before accepted Introduction", async () => {
    await expect(getAuthorizedAttachment(provider.id, false, attachmentId)).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    await expect(getAuthorizedAttachment(buyer.id, false, attachmentId)).resolves.toMatchObject({ id: attachmentId, visibility: "BUYER_ONLY" });
  });

  it("returns healthy liveness and readiness without internal connection strings", async () => {
    const { GET: live } = await import("../../src/app/api/v1/health/live/route");
    const { GET: ready } = await import("../../src/app/api/v1/health/ready/route");
    expect((await live()).status).toBe(200);
    const response = await ready(); const body = await response.text();
    expect(response.status).toBe(200); expect(body).not.toContain("postgresql://"); expect(body).not.toContain("redis://");
  });

  it("enforces namespaced Redis rate limits", async () => {
    const request = new Request("http://localhost/api/v1/test", { headers: { "x-forwarded-for": `phase10-${nonce}` } });
    await expect(enforceFeatureRateLimit(request, `integration-${nonce}`, 1, 60)).resolves.toBeUndefined();
    await expect(enforceFeatureRateLimit(request, `integration-${nonce}`, 1, 60)).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
  });

  it("keeps local email and storage modes explicit without pretending delivery", async () => {
    await expect(sendTransactionalEmail("recipient@example.test", { type: "security_notification", message: "Security test", appUrl: "http://localhost:3000/app/settings/security" })).resolves.toMatchObject({ mode: "log" });
    expect(createPresignedUpload(`${buyer.id}/company_document/shared/file.pdf`, "application/pdf", 1000)).toMatchObject({ mode: "mock", enabled: false, url: null });
  });
});
