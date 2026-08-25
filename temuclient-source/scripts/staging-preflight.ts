import { getServerEnv } from "../src/lib/env";

const env = getServerEnv();
const failures: string[] = [];
const fail = (message: string) => failures.push(message);

if (env.NODE_ENV !== "production" || env.APP_ENV !== "staging") {
  fail("Staging preflight requires NODE_ENV=production and APP_ENV=staging.");
}
if (!env.APP_URL.startsWith("https://")) {
  fail("Public staging APP_URL must use HTTPS.");
}
if (env.S3_PROVIDER !== "s3") {
  fail("Public staging must use private S3-compatible storage.");
}
if (env.EMAIL_PROVIDER !== "resend") {
  fail("Public staging must use the transactional email adapter.");
}
if (env.RATE_LIMIT_FAIL_OPEN) {
  fail("Public staging rate limiting must fail closed.");
}

const configuredValues = [
  env.APP_URL,
  env.AUTH_SECRET,
  env.DATABASE_URL,
  env.REDIS_URL,
  env.S3_ENDPOINT,
  env.S3_REGION,
  env.S3_BUCKET,
  env.S3_ACCESS_KEY_ID,
  env.S3_SECRET_ACCESS_KEY,
  env.STORAGE_SIGNING_SECRET,
  env.RESEND_API_KEY,
  env.BILLING_WEBHOOK_SECRET,
  env.ERROR_TRACKING_DSN,
];

if (configuredValues.some((value) => value?.includes("replace-with") || value?.includes(".example"))) {
  fail("Public staging configuration still contains an example or replacement value.");
}

if (failures.length > 0) {
  throw new Error(`Staging preflight failed: ${failures.join(" ")}`);
}

console.info(JSON.stringify({
  status: "ready",
  appEnv: env.APP_ENV,
  appUrl: env.APP_URL,
  storageProvider: env.S3_PROVIDER,
  emailProvider: env.EMAIL_PROVIDER,
  billingProvider: env.BILLING_PROVIDER,
  analyticsProvider: env.ANALYTICS_PROVIDER,
  aiProvider: env.AI_PROVIDER,
}));
