import { z } from "zod";

const booleanFromEnv = z.string().optional().transform((value) => value === "true");
const optionalUrl = z.string().trim().optional().transform((value) => value || undefined).pipe(z.url().optional());
const optionalString = z.string().trim().optional().transform((value) => value || undefined);
const optionalPositiveInteger = z.string().trim().optional().transform((value) => value ? Number(value) : undefined).pipe(z.number().int().positive().optional());
const defaultEnum = <T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) => z.preprocess((value) => value === "" ? undefined : value, z.enum(values).default(fallback));

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.url().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), { message: "DATABASE_URL must use PostgreSQL." }),
  REDIS_URL: z.url().refine((value) => value.startsWith("redis://") || value.startsWith("rediss://"), { message: "REDIS_URL must use Redis." }),
  RATE_LIMIT_FAIL_OPEN: booleanFromEnv,
  S3_PROVIDER: defaultEnum(["mock", "s3"], "mock"),
  S3_ENDPOINT: optionalUrl,
  S3_REGION: optionalString,
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_FORCE_PATH_STYLE: booleanFromEnv,
  STORAGE_SIGNING_SECRET: optionalString,
  EMAIL_PROVIDER: defaultEnum(["log", "resend"], "log"),
  EMAIL_FROM: z.email().default("noreply@temuclient.local"),
  RESEND_API_KEY: optionalString,
  BILLING_PROVIDER: defaultEnum(["sandbox", "midtrans"], "sandbox"),
  PAID_SUBSCRIPTIONS_ENABLED: booleanFromEnv,
  BILLING_WEBHOOK_SECRET: optionalString,
  PRO_MONTHLY_PRICE_IDR: optionalPositiveInteger,
  MIDTRANS_SERVER_KEY: optionalString,
  MIDTRANS_IS_PRODUCTION: booleanFromEnv,
  ANALYTICS_PROVIDER: defaultEnum(["database", "http"], "database"),
  ANALYTICS_ENDPOINT: optionalUrl,
  ANALYTICS_WRITE_KEY: optionalString,
  ERROR_TRACKING_DSN: optionalUrl,
  AI_PROVIDER: defaultEnum(["deterministic", "openai"], "deterministic"),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().trim().default("gpt-5.6-luna"),
}).superRefine((env, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  if (env.APP_ENV === "production") {
    if (!env.APP_URL.startsWith("https://")) issue("APP_URL", "Production APP_URL must use HTTPS.");
    if (env.AUTH_SECRET.includes("replace-with")) issue("AUTH_SECRET", "Production AUTH_SECRET must not use the example value.");
    if (env.S3_PROVIDER !== "s3") issue("S3_PROVIDER", "Production storage must use S3.");
    if (env.EMAIL_PROVIDER !== "resend") issue("EMAIL_PROVIDER", "Production email must use a transactional provider.");
    if (!env.BILLING_WEBHOOK_SECRET) issue("BILLING_WEBHOOK_SECRET", "Production billing webhook secret is required, including sandbox mode.");
  }
  if (env.S3_PROVIDER === "s3") for (const key of ["S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const) if (!env[key]) issue(key, `${key} is required for S3 storage.`);
  if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) issue("RESEND_API_KEY", "RESEND_API_KEY is required for Resend.");
  if (env.PAID_SUBSCRIPTIONS_ENABLED) {
    if (env.BILLING_PROVIDER !== "midtrans") issue("BILLING_PROVIDER", "Paid subscriptions require the Midtrans QRIS provider.");
    if (!env.MIDTRANS_SERVER_KEY) issue("MIDTRANS_SERVER_KEY", "MIDTRANS_SERVER_KEY is required for QRIS payments.");
    if (!env.PRO_MONTHLY_PRICE_IDR) issue("PRO_MONTHLY_PRICE_IDR", "PRO_MONTHLY_PRICE_IDR is required for paid subscriptions.");
  }
  if (env.APP_ENV === "production" && env.PAID_SUBSCRIPTIONS_ENABLED && !env.MIDTRANS_IS_PRODUCTION) issue("MIDTRANS_IS_PRODUCTION", "Production paid subscriptions must use the Midtrans production endpoint.");
  if (env.ANALYTICS_PROVIDER === "http" && (!env.ANALYTICS_ENDPOINT || !env.ANALYTICS_WRITE_KEY)) issue("ANALYTICS_ENDPOINT", "HTTP analytics endpoint and write key are required.");
  if (env.AI_PROVIDER === "openai" && !env.OPENAI_API_KEY) issue("OPENAI_API_KEY", "OPENAI_API_KEY is required for OpenAI.");
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
let cachedEnv: ServerEnv | undefined;

export function parseServerEnv(source: NodeJS.ProcessEnv): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".") || "environment"))].join(", ");
    throw new Error(`Invalid server environment: ${fields}`);
  }
  return result.data;
}

export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}
