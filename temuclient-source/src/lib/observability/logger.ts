const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|storageKey|body|prompt/i;

export type LogContext = Record<string, unknown>;

export function sanitizeLogContext(context: LogContext): LogContext {
  return Object.fromEntries(Object.entries(context).map(([key, value]) => [key, SENSITIVE_KEYS.test(key) ? "[REDACTED]" : value instanceof Error ? { name: value.name, message: value.message } : value]));
}

function write(level: "info" | "warn" | "error", message: string, context: LogContext = {}) {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...sanitizeLogContext(context) });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
