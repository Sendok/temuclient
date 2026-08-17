export function canAccessConversation(
  participant: { userId: string; organizationId: string } | null,
  userId: string,
  organizationId: string,
) {
  return (
    participant?.userId === userId &&
    participant.organizationId === organizationId
  );
}
