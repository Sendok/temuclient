import { getServerEnv } from "@/lib/env";
import { logger, type LogContext } from "@/lib/observability/logger";

export interface ErrorTracker { capture(error: unknown, context?: LogContext): Promise<void>; }

class StructuredLogErrorTracker implements ErrorTracker {
  async capture(error: unknown, context: LogContext = {}) { logger.error("captured_exception", { ...context, error }); }
}

export function getErrorTracker(): ErrorTracker {
  // ERROR_TRACKING_DSN is intentionally an integration point. Until a vendor
  // adapter is selected, structured stderr remains the production-safe sink.
  void getServerEnv().ERROR_TRACKING_DSN;
  return new StructuredLogErrorTracker();
}
