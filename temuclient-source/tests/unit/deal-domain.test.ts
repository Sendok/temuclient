import { describe, expect, it } from "vitest";

import {
  canCreateDeal,
  canManageDeal,
  canReadDeal,
} from "../../src/modules/deals/permissions";
import {
  assertDealAdvance,
  canAdvanceDeal,
  canMarkDealLost,
  canMarkDealWon,
  stageProbability,
} from "../../src/modules/deals/state-machine";
import { updateDealSchema } from "../../src/modules/deals/schema";
import {
  canTransitionProposalStatus,
  nextProposalVersion,
} from "../../src/modules/proposals/versioning";

describe("Deal state machine", () => {
  it("allows only sequential active stage progression", () => {
    expect(canAdvanceDeal("INTRODUCTION", "DISCOVERY")).toBe(true);
    expect(canAdvanceDeal("DISCOVERY", "PROPOSAL")).toBe(true);
    expect(canAdvanceDeal("PROPOSAL", "NEGOTIATION")).toBe(true);
    expect(canAdvanceDeal("INTRODUCTION", "PROPOSAL")).toBe(false);
    expect(() => assertDealAdvance("NEGOTIATION", "DISCOVERY")).toThrow(/tidak dapat/);
  });

  it("requires Negotiation for Won and permits Lost from every active stage", () => {
    expect(canMarkDealWon("NEGOTIATION")).toBe(true);
    expect(canMarkDealWon("PROPOSAL")).toBe(false);
    for (const stage of ["INTRODUCTION", "DISCOVERY", "PROPOSAL", "NEGOTIATION"] as const)
      expect(canMarkDealLost(stage)).toBe(true);
    expect(canMarkDealLost("WON")).toBe(false);
  });

  it("defines bounded default probabilities", () => {
    expect(stageProbability("INTRODUCTION")).toBe(10);
    expect(stageProbability("NEGOTIATION")).toBe(80);
    expect(stageProbability("WON")).toBe(100);
    expect(stageProbability("LOST")).toBe(0);
    expect(updateDealSchema.safeParse({ probability: 101 }).success).toBe(false);
    expect(updateDealSchema.safeParse({ probability: -1 }).success).toBe(false);
  });
});

describe("Deal permissions", () => {
  it("isolates Provider tenants and enforces manager/assigned Sales rules", () => {
    expect(canReadDeal("provider-a", "provider-a")).toBe(true);
    expect(canReadDeal("provider-a", "provider-b")).toBe(false);
    expect(canManageDeal("OWNER", "owner", "sales")).toBe(true);
    expect(canManageDeal("ADMIN", "admin", "sales")).toBe(true);
    expect(canManageDeal("SALES", "sales", "sales")).toBe(true);
    expect(canManageDeal("SALES", "other", "sales")).toBe(false);
    expect(canManageDeal("MEMBER", "sales", "sales")).toBe(false);
    expect(canCreateDeal("SALES")).toBe(true);
    expect(canCreateDeal("MEMBER")).toBe(false);
  });
});

describe("Proposal version and status rules", () => {
  it("increments immutable versions monotonically", () => {
    expect(nextProposalVersion(null)).toBe(1);
    expect(nextProposalVersion(1)).toBe(2);
    expect(nextProposalVersion(7)).toBe(8);
    expect(() => nextProposalVersion(0)).toThrow();
  });

  it("allows only documented proposal outcomes", () => {
    expect(canTransitionProposalStatus("DRAFT", "WITHDRAWN")).toBe(true);
    expect(canTransitionProposalStatus("DRAFT", "ACCEPTED")).toBe(false);
    expect(canTransitionProposalStatus("SUBMITTED", "ACCEPTED")).toBe(true);
    expect(canTransitionProposalStatus("SUBMITTED", "REJECTED")).toBe(true);
    expect(canTransitionProposalStatus("ACCEPTED", "DRAFT")).toBe(false);
  });
});
