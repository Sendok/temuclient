-- Enforce the active duplicate rule under concurrent requests.
CREATE UNIQUE INDEX "Introduction_active_opportunity_provider_key"
ON "Introduction" ("opportunityId", "providerOrganizationId")
WHERE "status" IN ('REQUESTED', 'ACCEPTED');
