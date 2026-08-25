# TemuClient V1 — Google Cloud Deployment

> This document is the Cloud SQL profile. For the lower-cost Cloud Run + Neon
> profile selected for current staging, use
> `GOOGLE_CLOUD_NEON_DEPLOYMENT.md`. Do not combine Cloud SQL socket arguments
> with Neon connection URLs.

## Decision

Deploy the existing standalone container to Cloud Run. Use Artifact Registry for
immutable images, Cloud Build for validation and image creation, a Cloud Run Job
for Prisma migrations, Cloud SQL for PostgreSQL, Secret Manager for credentials,
and Cloud Logging/Monitoring for operations.

The default region is `asia-southeast2` (Jakarta). Keep the application,
database, Redis, registry, and bucket in one region where each product supports
it. Do not introduce GKE for this modular monolith.

## Required owner inputs

Before creating billable resources, the release owner must provide:

- Google Cloud project ID with billing enabled;
- staging hostname and DNS access;
- the Google Cloud principal that will deploy;
- approved resource sizes, retention, and budget alerts;
- transactional email, billing, AI, and error-tracking provider choices;
- the approvers required by `STAGING_RELEASE.md`.

Never commit secrets or pass them as Docker build arguments.

## 1. Bootstrap the project

Run these commands from Cloud Shell or a workstation with an authenticated
Google Cloud CLI. Replace the shell variables before executing them.

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="asia-southeast2"
export GCP_REPOSITORY="temuclient"
export GCP_SERVICE="temuclient-staging"
export GCP_RUNTIME_SERVICE_ACCOUNT="temuclient-runtime@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$GCP_PROJECT_ID"
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  vpcaccess.googleapis.com

gcloud artifacts repositories create "$GCP_REPOSITORY" \
  --repository-format=docker \
  --location="$GCP_REGION" \
  --description="TemuClient release images"

gcloud iam service-accounts create temuclient-runtime \
  --display-name="TemuClient Cloud Run runtime"
```

Grant the runtime identity only the roles it needs. It normally needs
`roles/cloudsql.client`, `roles/secretmanager.secretAccessor`, and no project
Editor role. Scope Secret Manager access to the named secrets when practical.

## 2. Provision managed dependencies

Create a dedicated staging Cloud SQL PostgreSQL instance and database. Enable
automated backups and point-in-time recovery before storing business data. Use
the Cloud SQL connection name when deploying the service and migration job.

The Prisma/PostgreSQL connection secret can use the Cloud SQL Unix socket:

```text
postgresql://DB_USER:URL_ENCODED_PASSWORD@localhost/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME&schema=public
```

For Redis, choose one of these supported paths:

- Memorystore for Redis with Direct VPC egress from Cloud Run. Use a private
  `redis://PRIVATE_IP:6379` URL and restrict network access.
- A TLS-managed Redis provider such as Upstash for a lower-complexity staging
  deployment. Use its `rediss://` URL.

For files, create a private Cloud Storage bucket with public access prevention,
uniform bucket-level access, CORS restricted to the staging origin, versioning,
and lifecycle rules from `PRODUCTION_RUNBOOK.md`. The current storage adapter
uses the Cloud Storage XML API through its S3-compatible HMAC surface:

```text
S3_ENDPOINT=https://storage.googleapis.com
S3_FORCE_PATH_STYLE=true
```

Create a dedicated Cloud Storage HMAC key. Store its access ID and secret in
Secret Manager. Verify signed upload and download against staging before launch;
do not make the bucket public.

## 3. Create secrets

Create these Secret Manager entries. Values shown are secret names, not secret
values:

```text
temuclient-auth-secret
temuclient-database-url
temuclient-redis-url
temuclient-s3-access-key-id
temuclient-s3-secret-access-key
temuclient-storage-signing-secret
temuclient-resend-api-key
temuclient-billing-webhook-secret
temuclient-bootstrap-admin-password
```

Add optional secrets only when their adapter is enabled:

```text
temuclient-gemini-api-key
temuclient-midtrans-server-key
```

Generate `AUTH_SECRET`, `STORAGE_SIGNING_SECRET`, and
`BILLING_WEBHOOK_SECRET` independently with a cryptographically secure random
source. Do not reuse a value across staging and production.

## 4. Build and record immutable images

`cloudbuild.yaml` runs lint, typecheck, database-independent unit tests, and then
builds separate runtime and migration images. It tags both with Cloud Build's
immutable build ID. Run the integration suite against an isolated, migrated,
seeded PostgreSQL database before accepting the build as a release candidate;
the image build intentionally has no access to deployment databases.

```bash
gcloud builds submit \
  --region="$GCP_REGION" \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${GCP_REGION},_REPOSITORY=${GCP_REPOSITORY},_SERVICE=temuclient"
```

Record the successful build ID and resolved image digests. Use the digest—not a
mutable `latest` tag—for migration and deployment.

## 5. Configure and execute the migration job

Set the values for the release being deployed:

```bash
export GCP_BUILD_ID="successful-cloud-build-id"
export GCP_CLOUD_SQL_CONNECTION="${GCP_PROJECT_ID}:${GCP_REGION}:temuclient-staging"
export GCP_MIGRATION_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_REPOSITORY}/temuclient-migration:${GCP_BUILD_ID}"

gcloud run jobs deploy temuclient-staging-migrate \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --image="$GCP_MIGRATION_IMAGE" \
  --service-account="$GCP_RUNTIME_SERVICE_ACCOUNT" \
  --set-cloudsql-instances="$GCP_CLOUD_SQL_CONNECTION" \
  --set-secrets="DATABASE_URL=temuclient-database-url:latest" \
  --tasks=1 \
  --max-retries=0 \
  --task-timeout=10m

gcloud run jobs execute temuclient-staging-migrate \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --wait
```

Inspect migration SQL and take a database backup before executing the job. A
failed migration blocks application deployment.

## 5a. Bootstrap the first platform administrator

Do not run `prisma db seed` outside development or test. After the first
migration, create the initial `SUPER_ADMIN` through a one-use, auditable Cloud
Run Job. Store a unique password of at least 12 characters in
`temuclient-bootstrap-admin-password`; never put it directly in a shell command
or commit it to a file.

```bash
export TEMUCLIENT_ADMIN_EMAIL="admin@your-company.example"
export TEMUCLIENT_ADMIN_NAME="TemuClient Administrator"

gcloud run jobs deploy temuclient-staging-bootstrap-admin \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --image="$GCP_MIGRATION_IMAGE" \
  --service-account="$GCP_RUNTIME_SERVICE_ACCOUNT" \
  --set-cloudsql-instances="$GCP_CLOUD_SQL_CONNECTION" \
  --command=npm \
  --args=run,admin:bootstrap \
  --set-env-vars="BOOTSTRAP_ADMIN_EMAIL=${TEMUCLIENT_ADMIN_EMAIL},BOOTSTRAP_ADMIN_NAME=${TEMUCLIENT_ADMIN_NAME}" \
  --set-secrets="DATABASE_URL=temuclient-database-url:latest,BOOTSTRAP_ADMIN_PASSWORD=temuclient-bootstrap-admin-password:latest" \
  --tasks=1 \
  --max-retries=0 \
  --task-timeout=10m

gcloud run jobs execute temuclient-staging-bootstrap-admin \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --wait
```

The command refuses to create a second platform administrator, refuses to
promote an existing ordinary user, hashes the password, and records an audit
entry. Delete or disable access to the bootstrap password secret after the job
succeeds. Additional platform admins must be created through an approved,
audited admin procedure.

## 6. Deploy the Cloud Run service

Copy `deploy/gcp/cloud-run.staging.env.yaml.example` to an untracked file,
replace every example value, and keep secrets out of it. Set `APP_URL` to the
final HTTPS staging origin.

```bash
export GCP_RUNTIME_IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_REPOSITORY}/temuclient:${GCP_BUILD_ID}"

gcloud run deploy "$GCP_SERVICE" \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --image="$GCP_RUNTIME_IMAGE" \
  --service-account="$GCP_RUNTIME_SERVICE_ACCOUNT" \
  --allow-unauthenticated \
  --port=3000 \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=40 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60s \
  --set-cloudsql-instances="$GCP_CLOUD_SQL_CONNECTION" \
  --env-vars-file=deploy/gcp/cloud-run.staging.env.yaml \
  --set-secrets="AUTH_SECRET=temuclient-auth-secret:latest,DATABASE_URL=temuclient-database-url:latest,REDIS_URL=temuclient-redis-url:latest,S3_ACCESS_KEY_ID=temuclient-s3-access-key-id:latest,S3_SECRET_ACCESS_KEY=temuclient-s3-secret-access-key:latest,STORAGE_SIGNING_SECRET=temuclient-storage-signing-secret:latest,RESEND_API_KEY=temuclient-resend-api-key:latest,BILLING_WEBHOOK_SECRET=temuclient-billing-webhook-secret:latest,GEMINI_API_KEY=temuclient-gemini-api-key:latest" \
  --startup-probe="httpGet.path=/api/v1/health/live,initialDelaySeconds=0,timeoutSeconds=5,periodSeconds=5,failureThreshold=12" \
  --liveness-probe="httpGet.path=/api/v1/health/live,initialDelaySeconds=10,timeoutSeconds=5,periodSeconds=15,failureThreshold=4"
```

When using Memorystore, add Direct VPC egress with the approved network and
subnet. Do not route all internet traffic through the VPC unless Cloud NAT and
the resulting egress behavior have been designed explicitly.

## 6a. Import reviewed Markdown articles

The public Insight pages read published articles from PostgreSQL. Files under
`content/articles` are source content, not an automatic database seed. Import
them only after the platform administrator exists, using the migration image
that contains the reviewed source files:

```bash
gcloud run jobs deploy temuclient-staging-import-articles \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --image="$GCP_MIGRATION_IMAGE" \
  --service-account="$GCP_RUNTIME_SERVICE_ACCOUNT" \
  --set-cloudsql-instances="$GCP_CLOUD_SQL_CONNECTION" \
  --command=npm \
  --args=run,articles:import \
  --set-env-vars="NODE_ENV=production,APP_ENV=staging,APP_URL=${GCP_SERVICE_URL},RATE_LIMIT_FAIL_OPEN=false,ARTICLE_IMPORT_ACTOR_EMAIL=${TEMUCLIENT_ADMIN_EMAIL}" \
  --set-secrets="AUTH_SECRET=temuclient-auth-secret:latest,DATABASE_URL=temuclient-database-url:latest,REDIS_URL=temuclient-redis-url:latest" \
  --tasks=1 \
  --max-retries=0 \
  --task-timeout=15m

gcloud run jobs execute temuclient-staging-import-articles \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --wait
```

Set `GCP_SERVICE_URL` to the deployed HTTPS origin first. The import validates
the actor's platform role, upserts by article slug, and writes an audit record
for every created or updated article, so rerunning the same reviewed content is
safe.

## 7. Domain, verification, and promotion

Put the final HTTPS hostname in front of Cloud Run using the approved Google
Cloud domain/load-balancing path, then update `APP_URL` and redeploy the same
image digest. Configure DNS and certificates before testing login links and
billing webhooks.

Run:

```bash
curl --fail --silent --show-error "https://STAGING_HOST/api/v1/health/live"
curl --fail --silent --show-error "https://STAGING_HOST/api/v1/health/ready"
```

Then execute `docs/LAUNCH_CHECKLIST.md`, verify logs and alerts, test rollback,
and complete the formal approval in `docs/STAGING_RELEASE.md`. Production must
promote the same reviewed digest with production-only secrets. It must not be
approved automatically.

## Cost and security guardrails

- Configure a billing budget and alerts before provisioning.
- Keep Cloud Run `max-instances` within the tested Cloud SQL connection budget.
- Use separate staging and production projects or, at minimum, separate
  identities, databases, buckets, Redis instances, and secrets.
- Never run `prisma db seed` or `prisma migrate dev` in staging/production.
- Never expose Cloud SQL, Memorystore, Cloud Storage objects, or Secret Manager
  values publicly.
- Enable logs-based alerts for readiness failures, HTTP 5xx, migration failure,
  database saturation, webhook failure, and authentication anomalies.
