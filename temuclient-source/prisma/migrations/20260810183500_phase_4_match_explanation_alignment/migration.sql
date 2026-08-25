-- Preserve persisted deterministic explanations while aligning with DATABASE_SCHEMA.md.
ALTER TABLE "OpportunityMatch" RENAME COLUMN "reasonsJson" TO "explanationJson";
