import type { Prisma } from "@/generated/prisma/client";

export type DealDomainEvent = {
  name: "DealStageChanged" | "DealWon" | "DealLost" | "ProposalSubmitted";
  dealId: string;
  dealTitle: string;
  recipientUserIds: string[];
};

export interface DealEventPublisher {
  publish(transaction: Prisma.TransactionClient, event: DealDomainEvent): Promise<void>;
}

export const databaseDealEventPublisher: DealEventPublisher = {
  async publish(transaction, event) {
    const analyticsName = event.name === "ProposalSubmitted" ? "proposal_submitted" : event.name === "DealWon" ? "deal_won" : event.name === "DealLost" ? "deal_lost" : null;
    if (analyticsName) await transaction.analyticsEvent.create({ data: { name: analyticsName, entityType: "Deal", entityId: event.dealId } });
    if (!event.recipientUserIds.length) return;
    const content = eventContent(event);
    await transaction.notification.createMany({
      data: event.recipientUserIds.map((userId) => ({
        userId,
        type: content.type,
        title: content.title,
        body: content.body,
        entityType: event.name === "ProposalSubmitted" ? "Deal" : "Deal",
        entityId: event.dealId,
      })),
    });
  },
};

function eventContent(event: DealDomainEvent) {
  if (event.name === "ProposalSubmitted")
    return {
      type: "PROPOSAL" as const,
      title: "Proposal baru disubmit",
      body: `Proposal untuk ${event.dealTitle} siap ditinjau.`,
    };
  if (event.name === "DealWon")
    return {
      type: "DEAL_UPDATE" as const,
      title: "Deal berhasil dimenangkan",
      body: `${event.dealTitle} telah ditandai Won.`,
    };
  if (event.name === "DealLost")
    return {
      type: "DEAL_UPDATE" as const,
      title: "Deal ditutup",
      body: `${event.dealTitle} telah ditandai Lost.`,
    };
  return {
    type: "DEAL_UPDATE" as const,
    title: "Deal diperbarui",
    body: `Progress ${event.dealTitle} telah diperbarui.`,
  };
}
