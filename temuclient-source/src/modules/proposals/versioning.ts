export function nextProposalVersion(latestVersion: number | null) {
  if (latestVersion != null && (!Number.isInteger(latestVersion) || latestVersion < 1))
    throw new Error("Proposal version must be a positive integer.");
  return (latestVersion ?? 0) + 1;
}

export function canTransitionProposalStatus(from: string, to: string) {
  return (
    (from === "DRAFT" && to === "WITHDRAWN") ||
    (from === "SUBMITTED" && ["ACCEPTED", "REJECTED", "WITHDRAWN"].includes(to))
  );
}
