# TemuClient — Google Cloud Run + Neon Deployment

## Scope and topology

This is the cost-optimized staging profile for TemuClient:

```text
User
  ↓ HTTPS
Google Cloud Run — Jakarta (asia-southeast2)
  ├─ Neon PostgreSQL pooled endpoint — Singapore
  ├─ Upstash Redis TLS endpoint
  ├─ Google Secret Manager
  └─ Gemini API
```

Artifact Registry and Cloud Build remain in Google Cloud. Neon replaces Cloud
SQL only. PostgreSQL remains the commercial source of truth and Prisma remains
the ORM. Do not add `--set-cloudsql-instances` to any service or job in this
profile.

For staging, the documented environment uses mock file storage, log-only email,
and sandbox billing. It is suitable for database, authentication, taxonomy,
Insight, and workflow smoke tests. Formal production still requires persistent
private object storage, transactional email, backup approval, alerting, and the
launch gates in `LAUNCH_CHECKLIST.md`.

## 1. Create the Neon database — once

In the Neon Console:

1. Create project `temuclient-staging`.
2. Select PostgreSQL 17.
3. Select AWS Asia Pacific 1 — Singapore (`ap-southeast-1`).
4. Keep the default database or name it `temuclient`.
5. Open **Connect** and copy both connection strings:
   - pooled connection: hostname contains `-pooler`;
   - direct connection: hostname does not contain `-pooler`.
6. Both URLs must use TLS, normally through `sslmode=require`.

Use the pooled URL only for the Cloud Run web service. Use the direct URL only
for migration, bootstrap-admin, article-import, and controlled database tools.
Do not commit either URL.

For a disposable staging database, create a fresh Neon database and rerun the
migration/bootstrap/import jobs below. If existing Cloud SQL data must be
preserved, stop here and perform a reviewed `pg_dump`/`pg_restore` migration;
never recreate a database that contains real Buyer, Provider, message, meeting,
or deal data.

## 2. Restore Cloud Shell variables — every new session

Cloud Shell does not retain exported variables after the shell closes. Run this
block whenever a new session starts:

```bash
export PROJECT_ID="temuclient-staging"
export REGION="asia-southeast2"
export REPOSITORY="temuclient"
export IMAGE_NAME="temuclient"
export SERVICE="temuclient-staging"
export MIGRATE_JOB="temuclient-staging-migrate"
export ADMIN_JOB="temuclient-staging-bootstrap-admin"
export ARTICLE_JOB="temuclient-staging-import-articles"
export RUNTIME_SERVICE_ACCOUNT="temuclient-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

printf 'PROJECT_ID=%s\nREGION=%s\nSERVICE=%s\n' \
  "$PROJECT_ID" "$REGION" "$SERVICE"
```

The output must not contain empty values.

## 3. Enable Google Cloud services — once

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com
```

Create the registry and runtime identity if they do not already exist:

```bash
gcloud artifacts repositories describe "$REPOSITORY" \
  --location="$REGION" >/dev/null 2>&1 || \
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="TemuClient release images"

gcloud iam service-accounts describe "$RUNTIME_SERVICE_ACCOUNT" \
  >/dev/null 2>&1 || \
gcloud iam service-accounts create temuclient-runtime \
  --display-name="TemuClient Cloud Run runtime"
```

No Cloud SQL API, Cloud SQL Client role, VPC connector, or Cloud SQL instance is
required for the Neon profile.

## 4. Create Secret Manager values — once, then rotate as needed

Required staging secrets:

```text
temuclient-database-url-pooled
temuclient-database-url-direct
temuclient-auth-secret
temuclient-redis-url
temuclient-gemini-api-key
temuclient-bootstrap-admin-password
```

Create database secrets without placing the URLs directly in shell history:

```bash
read -rsp "Paste Neon pooled URL: " NEON_POOLED_URL; echo
printf '%s' "$NEON_POOLED_URL" | gcloud secrets create \
  temuclient-database-url-pooled --replication-policy=automatic --data-file=-
unset NEON_POOLED_URL

read -rsp "Paste Neon direct URL: " NEON_DIRECT_URL; echo
printf '%s' "$NEON_DIRECT_URL" | gcloud secrets create \
  temuclient-database-url-direct --replication-policy=automatic --data-file=-
unset NEON_DIRECT_URL
```

If a secret already exists, use `versions add` instead of `create`:

```bash
read -rsp "Paste replacement value: " SECRET_VALUE; echo
printf '%s' "$SECRET_VALUE" | gcloud secrets versions add \
  SECRET_NAME --data-file=-
unset SECRET_VALUE
```

Generate a unique authentication secret:

```bash
openssl rand -base64 48 | gcloud secrets create \
  temuclient-auth-secret --replication-policy=automatic --data-file=-
```

Create `temuclient-redis-url` from the Upstash `rediss://` connection URL and
`temuclient-gemini-api-key` from the Gemini API key using the same secure
`read -rsp` pattern. The bootstrap password must be at least 12 characters and
contain uppercase, lowercase, number, and symbol.

Grant the runtime identity access only to the named staging secrets:

```bash
for SECRET_NAME in \
  temuclient-database-url-pooled \
  temuclient-database-url-direct \
  temuclient-auth-secret \
  temuclient-redis-url \
  temuclient-gemini-api-key \
  temuclient-bootstrap-admin-password
do
  gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
    --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

## 5. Upload or update the source

Open Cloud Shell, upload the repository archive, then make sure the extracted
repository contains `package.json`, `Dockerfile`, and `cloudbuild.yaml`:

```bash
cd ~
mkdir -p temuclient-source
cd temuclient-source

ls package.json Dockerfile cloudbuild.yaml
```

If using an update archive, extract it over this directory. Remove the obsolete
OpenAI provider if it is still present:

```bash
rm -f src/modules/ai/providers/openai.ts
```

Do not upload `.env`, database dumps, API keys, or passwords into the source
directory.

## 6. Allow Cloud Build to read source and push images — once

This project currently uses the Compute Engine default service account for
Cloud Build execution. Resolve it and grant the narrow build roles:

```bash
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" \
  --format='value(projectNumber)')"
export BUILD_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
export BUILD_BUCKET="${PROJECT_ID}_cloudbuild"

gcloud storage buckets describe "gs://${BUILD_BUCKET}" >/dev/null 2>&1 || \
gcloud storage buckets create "gs://${BUILD_BUCKET}" \
  --location="$REGION" \
  --uniform-bucket-level-access

gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" \
  --location="$REGION" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.writer"

gcloud storage buckets add-iam-policy-binding "gs://${BUILD_BUCKET}" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/logging.logWriter"
```

If the organization uses a dedicated Cloud Build service account, substitute
that identity instead of the Compute Engine default identity.

## 7. Build and validate the images — every release

From the repository root:

```bash
cd ~/temuclient-source

gcloud builds submit \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${REGION},_REPOSITORY=${REPOSITORY},_SERVICE=${IMAGE_NAME}"
```

The build must finish with `STATUS: SUCCESS`. Record the build ID:

```bash
gcloud builds list \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --limit=5

export BUILD_ID="PASTE_SUCCESSFUL_BUILD_ID"
export RUNTIME_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${BUILD_ID}"
export MIGRATION_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}-migration:${BUILD_ID}"

printf '%s\n%s\n' "$RUNTIME_IMAGE" "$MIGRATION_IMAGE"
```

Do not continue if either image is missing.

## 8. Run Prisma migrations against Neon — every schema release

The migration job maps the **direct** Neon secret to `DATABASE_URL`:

```bash
gcloud run jobs deploy "$MIGRATE_JOB" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$MIGRATION_IMAGE" \
  --service-account="$RUNTIME_SERVICE_ACCOUNT" \
  --set-secrets="DATABASE_URL=temuclient-database-url-direct:latest" \
  --tasks=1 \
  --max-retries=0 \
  --task-timeout=10m

gcloud run jobs execute "$MIGRATE_JOB" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --wait
```

Inspect a failure with:

```bash
gcloud logging read \
  "resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"${MIGRATE_JOB}\"" \
  --project="$PROJECT_ID" \
  --freshness=30m \
  --limit=50 \
  --format="value(textPayload)"
```

Never run `prisma migrate dev`, `prisma db push`, or `prisma db seed` against
staging or production.

## 9. Configure the staging environment file

```bash
cp deploy/gcp/cloud-run.neon.staging.env.yaml.example \
  deploy/gcp/cloud-run.neon.staging.env.yaml
nano deploy/gcp/cloud-run.neon.staging.env.yaml
```

For an existing Cloud Run service, resolve the exact origin:

```bash
export SERVICE_URL="$(gcloud run services describe "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='value(status.url)')"

printf 'SERVICE_URL=%s\n' "$SERVICE_URL"
```

Put that exact value in `APP_URL`. Do not add a trailing slash. For a brand-new
service, use a temporary HTTPS placeholder for the first deploy, resolve
`status.url`, then immediately update `APP_URL` and deploy a second revision
before testing login. An incorrect `APP_URL` causes `CSRF_REJECTED`.

The real environment file is intentionally ignored and must never be committed.

## 10. Deploy Cloud Run using the pooled Neon URL — every release

```bash
gcloud run deploy "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$RUNTIME_IMAGE" \
  --service-account="$RUNTIME_SERVICE_ACCOUNT" \
  --allow-unauthenticated \
  --port=3000 \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=40 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60s \
  --env-vars-file=deploy/gcp/cloud-run.neon.staging.env.yaml \
  --set-secrets="AUTH_SECRET=temuclient-auth-secret:latest,DATABASE_URL=temuclient-database-url-pooled:latest,REDIS_URL=temuclient-redis-url:latest,GEMINI_API_KEY=temuclient-gemini-api-key:latest" \
  --startup-probe="httpGet.path=/api/v1/health/live,initialDelaySeconds=0,timeoutSeconds=5,periodSeconds=5,failureThreshold=12" \
  --liveness-probe="httpGet.path=/api/v1/health/live,initialDelaySeconds=10,timeoutSeconds=5,periodSeconds=15,failureThreshold=4"
```

There is deliberately no `--set-cloudsql-instances` argument. Limiting staging
to five Cloud Run instances reduces accidental database connection and cost
spikes. Increase it only after measuring pooled connection usage.

## 11. Bootstrap the first admin — once per new database

```bash
export ADMIN_EMAIL="admin@your-company.example"
export ADMIN_NAME="TemuClient Administrator"

gcloud run jobs deploy "$ADMIN_JOB" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$MIGRATION_IMAGE" \
  --service-account="$RUNTIME_SERVICE_ACCOUNT" \
  --command=npm \
  --args=run,admin:bootstrap \
  --set-env-vars="BOOTSTRAP_ADMIN_EMAIL=${ADMIN_EMAIL},BOOTSTRAP_ADMIN_NAME=${ADMIN_NAME}" \
  --set-secrets="DATABASE_URL=temuclient-database-url-direct:latest,BOOTSTRAP_ADMIN_PASSWORD=temuclient-bootstrap-admin-password:latest" \
  --tasks=1 \
  --max-retries=0 \
  --task-timeout=10m

gcloud run jobs execute "$ADMIN_JOB" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --wait
```

The bootstrap job intentionally refuses to create a second platform admin.

## 12. Import reviewed Insight articles — once, then after content updates

```bash
export SERVICE_URL="$(gcloud run services describe "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='value(status.url)')"

gcloud run jobs deploy "$ARTICLE_JOB" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$MIGRATION_IMAGE" \
  --service-account="$RUNTIME_SERVICE_ACCOUNT" \
  --command=npm \
  --args=run,articles:import \
  --set-env-vars="NODE_ENV=production,APP_ENV=staging,APP_URL=${SERVICE_URL},RATE_LIMIT_FAIL_OPEN=false,ARTICLE_IMPORT_ACTOR_EMAIL=${ADMIN_EMAIL}" \
  --set-secrets="AUTH_SECRET=temuclient-auth-secret:latest,DATABASE_URL=temuclient-database-url-direct:latest,REDIS_URL=temuclient-redis-url:latest" \
  --tasks=1 \
  --max-retries=0 \
  --task-timeout=15m

gcloud run jobs execute "$ARTICLE_JOB" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --wait
```

The import is idempotent by article slug and creates admin audit records.

## 13. Smoke test

```bash
export SERVICE_URL="$(gcloud run services describe "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format='value(status.url)')"

curl --fail --silent --show-error "${SERVICE_URL}/api/v1/health/live"
curl --fail --silent --show-error "${SERVICE_URL}/api/v1/health/ready"

curl -i -X POST \
  "${SERVICE_URL}/api/v1/auth/admin-login" \
  -H "Origin: ${SERVICE_URL}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected results:

- live and ready return HTTP 200;
- readiness reports both database and Redis as `ok`;
- empty admin login returns HTTP 400 `VALIDATION_ERROR`, not HTTP 500 and not
  `CSRF_REJECTED`;
- `/insight` lists imported published articles;
- admin login works with the bootstrapped account;
- Buyer and Provider registration/onboarding smoke tests can continue.

## 14. Recurring deployment summary

After the one-time setup, a normal release is only:

```text
Restore shell variables
→ Upload/pull reviewed source
→ Cloud Build
→ Record BUILD_ID
→ Deploy migration job with direct Neon secret
→ Execute migration
→ Deploy Cloud Run with pooled Neon secret
→ Import articles only if content changed
→ Run readiness and role smoke tests
```

Do not automatically approve production. Complete the staging release record,
backup/restore drill, storage/email configuration, monitoring, and formal launch
approval first.
