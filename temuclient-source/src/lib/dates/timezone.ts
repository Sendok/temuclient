import { DomainError } from "@/lib/errors/domain-error";

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export function isValidTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat("id-ID", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function assertValidTimezone(timezone: string) {
  if (!isValidTimezone(timezone))
    throw new DomainError("VALIDATION_ERROR", "Zona waktu tidak valid.", 400, {
      timezone: "Gunakan nama zona waktu IANA, misalnya Asia/Jakarta.",
    });
}

export function formatInTimezone(
  value: Date | string,
  timezone = DEFAULT_TIMEZONE,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
}
