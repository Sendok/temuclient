import { redirect } from "next/navigation";

import {
  FoundationApp,
  type FoundationData,
} from "@/components/foundation/foundation-app";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { getProviderProfile } from "@/modules/provider/service";
import {
  getBuyerOpportunity,
  listBuyerOpportunities,
} from "@/modules/opportunities/service";
import {
  compareMatchedProviders,
  getMatchedProviderForBuyer,
  getProviderOpportunity,
  listBuyerOpportunityMatches,
  listProviderOpportunityFeed,
} from "@/modules/matching/service";
import {
  compareProviderIdsSchema,
  providerFeedQuerySchema,
} from "@/modules/matching/schema";
import {
  getIntroduction,
  listIntroductions,
} from "@/modules/introductions/service";
import { introductionListQuerySchema } from "@/modules/introductions/schema";
import {
  getConversation,
  listConversations,
  listMessages,
} from "@/modules/conversations/service";
import { messageListQuerySchema } from "@/modules/conversations/schema";
import { getMeeting, listMeetings } from "@/modules/meetings/service";
import { meetingListQuerySchema } from "@/modules/meetings/schema";
import { listNotifications } from "@/modules/notifications/service";
import { dealListQuerySchema } from "@/modules/deals/schema";
import { getDeal, listDeals } from "@/modules/deals/service";
import { getProposal } from "@/modules/proposals/service";
import { getAISalesContext } from "@/modules/ai/sales-service";
import { listOrganizationVerifications } from "@/modules/verification/service";
import { getOrganizationSubscription } from "@/modules/billing/service";
import { getOrganizationAnalytics } from "@/modules/analytics/service";

const providerOnly = new Set([
  "opportunities",
  "deals",
  "proposals",
  "ai-sales",
  "analytics",
]);
const buyerOnly = new Set(["requirements", "providers"]);

export default async function FoundationAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug = [] } = await params;
  const rawSearch = await searchParams;
  const singleSearch = Object.fromEntries(
    Object.entries(rawSearch).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const session = await getCurrentSession();
  if (!session) redirect(`/login`);
  const membership = await db.organizationMember.findFirst({
    where: {
      userId: session.userId,
      organizationId: session.activeOrganizationId ?? undefined,
      status: "ACTIVE",
    },
    include: { organization: true },
  });
  if (!membership) redirect("/onboarding");
  if (!session.activeOrganizationId)
    await db.session.update({
      where: { id: session.id },
      data: { activeOrganizationId: membership.organizationId },
    });
  const members = ["OWNER", "ADMIN"].includes(membership.role)
    ? await db.organizationMember.findMany({
        where: { organizationId: membership.organizationId },
        select: {
          id: true,
          role: true,
          status: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      })
    : [];
  const first = slug[0];
  const forbidden =
    membership.organization.type === "BUYER"
      ? providerOnly.has(first ?? "")
      : buyerOnly.has(first ?? "");
  const isProvider = ["PROVIDER", "HYBRID"].includes(
    membership.organization.type,
  );
  const isBuyer = ["BUYER", "HYBRID"].includes(membership.organization.type);
  const providerProfile =
    isProvider &&
    (!first ||
      first === "company" ||
      (first === "opportunities" && Boolean(slug[1])))
      ? await getProviderProfile(
          membership.organizationId,
          Boolean(session.user.emailVerifiedAt),
        )
      : undefined;
  const providerTaxonomies =
    isProvider && first === "company"
      ? {
          services: await db.serviceCategory.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
            orderBy: { sortOrder: "asc" },
          }),
          industries: await db.industry.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
            orderBy: { sortOrder: "asc" },
          }),
          technologies: await db.technology.findMany({
            select: { id: true, name: true, category: true },
            orderBy: { name: "asc" },
          }),
        }
      : undefined;
  const buyerOpportunities =
    isBuyer && (!first || (first === "requirements" && slug.length === 1))
      ? await listBuyerOpportunities(membership.organizationId)
      : undefined;
  const buyerOpportunity =
    isBuyer && first === "requirements" && slug[1] && slug[1] !== "new"
      ? await getBuyerOpportunity(membership.organizationId, slug[1])
      : undefined;
  const buyerTaxonomies =
    isBuyer &&
    first === "requirements" &&
    (slug[1] === "new" || slug[2] === "review")
      ? {
          services: await db.serviceCategory.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { sortOrder: "asc" },
          }),
          industries: await db.industry.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { sortOrder: "asc" },
          }),
        }
      : undefined;
  const providerFeedQuery =
    isProvider && first === "opportunities" && slug.length === 1
      ? providerFeedQuerySchema.parse({
          ...singleSearch,
          minScore: singleSearch.matchMin,
          limit: singleSearch.pageSize,
        })
      : undefined;
  const providerFeed = providerFeedQuery
    ? await listProviderOpportunityFeed(
        membership.organizationId,
        providerFeedQuery,
      )
    : undefined;
  const providerOpportunity =
    isProvider && first === "opportunities" && slug[1]
      ? await getProviderOpportunity(membership.organizationId, slug[1], session.user.id)
      : undefined;
  const buyerMatches =
    isBuyer && first === "requirements" && slug[1] && slug[2] === "matches"
      ? await listBuyerOpportunityMatches(membership.organizationId, slug[1])
      : undefined;
  const buyerProvider =
    isBuyer && first === "providers" && slug[1]
      ? await getMatchedProviderForBuyer(
          membership.organizationId,
          slug[1],
          singleSearch.opportunity,
        )
      : undefined;
  const compareIds =
    isBuyer && first === "requirements" && slug[1] && slug[2] === "compare"
      ? compareProviderIdsSchema.parse(
          (singleSearch.providers ?? "").split(",").filter(Boolean),
        )
      : undefined;
  const comparedProviders =
    compareIds && slug[1]
      ? await compareMatchedProviders(
          membership.organizationId,
          slug[1],
          compareIds,
        )
      : undefined;
  const introductionQuery =
    first === "introductions" && slug.length === 1
      ? introductionListQuerySchema.parse(singleSearch)
      : undefined;
  const introductions = introductionQuery
    ? await listIntroductions(
        membership.organizationId,
        membership.organization.type,
        introductionQuery,
      )
    : undefined;
  const introduction =
    first === "introductions" && slug[1]
      ? await getIntroduction(membership.organizationId, slug[1])
      : undefined;
  const opportunityIntroductions =
    isProvider && first === "opportunities" && slug[1]
      ? await listIntroductions(
          membership.organizationId,
          membership.organization.type,
          { direction: "outgoing", opportunity: slug[1] },
        )
      : undefined;
  const existingIntroduction = opportunityIntroductions?.find((item) =>
    ["REQUESTED", "ACCEPTED"].includes(item.status),
  );
  const conversations =
    first === "messages" || first === "meetings"
      ? await listConversations(session.user.id, membership.organizationId, {})
      : undefined;
  const selectedConversationId =
    first === "messages"
      ? singleSearch.conversation ?? conversations?.items[0]?.id
      : undefined;
  const conversation = selectedConversationId
    ? await getConversation(session.user.id, membership.organizationId, selectedConversationId)
    : undefined;
  const messages = selectedConversationId
    ? await listMessages(
        session.user.id,
        membership.organizationId,
        selectedConversationId,
        messageListQuerySchema.parse({}),
      )
    : undefined;
  const displayedConversations =
    first === "messages" && selectedConversationId
      ? await listConversations(session.user.id, membership.organizationId, {})
      : conversations;
  const meetingQuery =
    first === "meetings"
      ? meetingListQuerySchema.parse({ view: singleSearch.view })
      : undefined;
  const meetings = meetingQuery
    ? await listMeetings(session.user.id, membership.organizationId, meetingQuery)
    : undefined;
  const meeting =
    first === "meetings" && slug[1]
      ? await getMeeting(session.user.id, membership.organizationId, slug[1])
      : undefined;
  const notifications =
    first === "notifications"
      ? await listNotifications(session.user.id, { limit: 50, unreadOnly: false })
      : undefined;
  const dealQuery =
    first === "deals" && slug.length === 1
      ? dealListQuerySchema.parse(singleSearch)
      : undefined;
  const deals = dealQuery
    ? await listDeals(membership.organizationId, dealQuery)
    : undefined;
  const deal =
    first === "deals" && slug[1]
      ? await getDeal(membership.organizationId, slug[1])
      : undefined;
  const proposal =
    first === "proposals" && slug[1]
      ? await getProposal(membership.organizationId, slug[1])
      : undefined;
  const aiSalesContext =
    isProvider && first === "ai-sales"
      ? await getAISalesContext({
          userId: session.user.id,
          organizationId: membership.organizationId,
          role: membership.role,
        })
      : undefined;
  const verifications =
    first === "company" && slug[1] === "verification"
      ? await listOrganizationVerifications(membership.organizationId)
      : undefined;
  const subscription =
    (first === "settings" && ["billing", "members"].includes(slug[1] ?? "")) || first === "analytics"
      ? await getOrganizationSubscription(membership.organizationId)
      : undefined;
  const analytics = first === "analytics" && subscription?.entitlements.advancedAnalytics
    ? await getOrganizationAnalytics(membership.organizationId, new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)), new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)))
    : undefined;
  const data: FoundationData = {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerifiedAt: session.user.emailVerifiedAt?.toISOString() ?? null,
    },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      type: membership.organization.type,
      website: membership.organization.website,
      city: membership.organization.city,
      description: membership.organization.description,
      businessEmail: membership.organization.businessEmail,
      status: membership.organization.status,
    },
    membership: { role: membership.role },
    members,
    providerProfile,
    providerTaxonomies,
    buyerOpportunities,
    buyerOpportunity,
    buyerTaxonomies,
    providerFeed,
    providerFeedQuery: singleSearch,
    providerOpportunity,
    buyerMatches,
    buyerProvider,
    comparedProviders,
    introductions,
    introduction,
    introductionStatusFilter: introductionQuery?.status,
    existingIntroduction,
    conversations: displayedConversations,
    conversation,
    messages,
    conversationExplicitlySelected: Boolean(singleSearch.conversation),
    meetings,
    meeting,
    meetingView: meetingQuery?.view,
    notifications,
    deals,
    deal,
    dealView: dealQuery?.view,
    dealTab: singleSearch.tab,
    dealFilters: singleSearch,
    proposal,
    aiSalesContext,
    aiTask: singleSearch.task,
    aiEntityId: singleSearch.entity,
    verifications,
    subscription,
    analytics,
  };
  return <FoundationApp data={data} forbidden={forbidden} slug={slug} />;
}
