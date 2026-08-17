import type { Instrumentation } from "next";

import { getServerEnv } from "@/lib/env";
import { getErrorTracker } from "@/lib/observability/error-tracking";
import { logger } from "@/lib/observability/logger";

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const env = getServerEnv();
  logger.info("application_started", {
    appEnv: env.APP_ENV,
    runtime: process.env.NEXT_RUNTIME,
    emailProvider: env.EMAIL_PROVIDER,
    storageProvider: env.S3_PROVIDER,
    billingProvider: env.BILLING_PROVIDER,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  await getErrorTracker().capture(error, {
    event: "unhandled_request_error",
    method: request.method,
    path: request.path,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  });
};
