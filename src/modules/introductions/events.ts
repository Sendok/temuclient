import type { Prisma } from "@/generated/prisma/client";

export type IntroductionDomainEvent = {
  name:
    | "IntroductionRequested"
    | "IntroductionAccepted"
    | "IntroductionDeclined"
    | "IntroductionCancelled";
  introductionId: string;
  opportunityTitle: string;
  providerName: string;
  recipientUserIds: string[];
};

export interface IntroductionEventPublisher {
  publish(
    transaction: Prisma.TransactionClient,
    event: IntroductionDomainEvent,
  ): Promise<void>;
}

export const databaseIntroductionEventPublisher: IntroductionEventPublisher = {
  async publish(transaction, event) {
    const analyticsName = event.name === "IntroductionRequested" ? "introduction_requested" : event.name === "IntroductionAccepted" ? "introduction_accepted" : null;
    if (analyticsName) await transaction.analyticsEvent.create({ data: { name: analyticsName, entityType: "Introduction", entityId: event.introductionId, propertiesJson: { opportunityTitle: event.opportunityTitle } } });
    if (!event.recipientUserIds.length) return;
    const content = eventContent(event);
    await transaction.notification.createMany({
      data: event.recipientUserIds.map((userId) => ({
        userId,
        type: content.type,
        title: content.title,
        body: content.body,
        entityType: "Introduction",
        entityId: event.introductionId,
      })),
    });
  },
};

function eventContent(event: IntroductionDomainEvent) {
  if (event.name === "IntroductionRequested")
    return {
      type: "INTRODUCTION_REQUESTED" as const,
      title: "Permintaan Introduction baru",
      body: `${event.providerName} meminta Introduction untuk ${event.opportunityTitle}.`,
    };
  if (event.name === "IntroductionAccepted")
    return {
      type: "INTRODUCTION_ACCEPTED" as const,
      title: "Introduction diterima",
      body: `Introduction untuk ${event.opportunityTitle} telah diterima.`,
    };
  if (event.name === "IntroductionDeclined")
    return {
      type: "INTRODUCTION_DECLINED" as const,
      title: "Introduction belum dilanjutkan",
      body: `Permintaan Introduction untuk ${event.opportunityTitle} tidak dilanjutkan.`,
    };
  return {
    type: "SYSTEM" as const,
    title: "Introduction dibatalkan",
    body: `Permintaan Introduction untuk ${event.opportunityTitle} telah dibatalkan.`,
  };
}
