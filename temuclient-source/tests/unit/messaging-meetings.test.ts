import { describe, expect, it } from "vitest";

import { canAccessConversation } from "../../src/modules/conversations/permissions";
import {
  canAccessMeeting,
  canManageMeeting,
  canTransitionMeeting,
} from "../../src/modules/meetings/permissions";
import {
  DEFAULT_TIMEZONE,
  formatInTimezone,
  isValidTimezone,
} from "../../src/lib/dates/timezone";

describe("conversation and meeting permissions", () => {
  it("requires the exact conversation user and organization pair", () => {
    const participant = { userId: "user-1", organizationId: "org-1" };
    expect(canAccessConversation(participant, "user-1", "org-1")).toBe(true);
    expect(canAccessConversation(participant, "user-1", "org-2")).toBe(false);
    expect(canAccessConversation(participant, "user-2", "org-1")).toBe(false);
    expect(canAccessConversation(null, "user-1", "org-1")).toBe(false);
  });

  it("keeps meetings participant-private and organizer-managed", () => {
    expect(canAccessMeeting(["user-1", "user-2"], "user-2")).toBe(true);
    expect(canAccessMeeting(["user-1", null], "user-3")).toBe(false);
    expect(canManageMeeting("user-1", "user-1")).toBe(true);
    expect(canManageMeeting("user-1", "user-2")).toBe(false);
  });

  it("allows only terminal transitions from scheduled", () => {
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW"] as const)
      expect(canTransitionMeeting("SCHEDULED", status)).toBe(true);
    expect(canTransitionMeeting("COMPLETED", "CANCELLED")).toBe(false);
  });
});

describe("timezone helpers", () => {
  it("validates IANA timezones and defaults to Jakarta", () => {
    expect(DEFAULT_TIMEZONE).toBe("Asia/Jakarta");
    expect(isValidTimezone("Asia/Jakarta")).toBe(true);
    expect(isValidTimezone("Jakarta/Invalid")).toBe(false);
  });

  it("renders UTC timestamps in Asia/Jakarta", () => {
    expect(formatInTimezone("2026-08-15T03:00:00.000Z", "Asia/Jakarta")).toContain("10.00");
  });
});
