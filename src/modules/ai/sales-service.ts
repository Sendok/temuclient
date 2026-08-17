import type { OrganizationRole } from "@/generated/prisma/enums";
import { DomainError } from "@/lib/errors/domain-error";
import { canManageDeal } from "@/modules/deals/permissions";
import { executeStructuredAI } from "@/modules/ai/execution";
import type { AIProvider } from "@/modules/ai/provider";
import { getAIProvider } from "@/modules/ai/provider-registry";
import {
  dealHealthSchema,
  discoveryAnalysisSchema,
  followUpDraftSchema,
  matchExplanationSchema,
  meetingPrepSchema,
  opportunitySummarySchema,
  proposalOutlineSchema,
  type DealHealth,
  type DiscoveryAnalysis,
  type FollowUpDraft,
  type MatchExplanation,
  type MeetingPrep,
  type OpportunitySummary,
  type ProposalOutline,
} from "@/modules/ai/sales-schema";
import { db } from "@/server/db/client";
import { z } from "zod";

type Actor = {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
};

const systemInstruction = `Anda adalah AI Sales Assistant TemuClient untuk jaringan opportunity B2B terverifikasi.
Gunakan hanya konteks yang diberikan. Jangan mengarang fakta, kontak, budget, stakeholder, atau komitmen.
Gunakan Bahasa Indonesia profesional dan ringkas. Tandai ketidakpastian secara eksplisit.
Output adalah bantuan yang wajib ditinjau manusia dan tidak boleh mengirim pesan atau mengubah data.`;

export async function generateOpportunitySummary(
  actor: Actor,
  opportunityId: string,
  provider: AIProvider = getAIProvider(),
) {
  const match = await getAuthorizedOpportunityMatch(actor.organizationId, opportunityId);
  const opportunity = match.opportunity;
  const fallback: OpportunitySummary = {
    conciseProblem: opportunity.problemStatement,
    scope: opportunity.requirements.length
      ? opportunity.requirements.map((item) => item.label).slice(0, 8)
      : [opportunity.serviceCategory?.name ?? "Scope perlu diklarifikasi"],
    budgetTimeline: `${formatRange(opportunity.budgetMin, opportunity.budgetMax, opportunity.currency)}; ${formatTimeline(opportunity.timelineStart, opportunity.timelineEnd)}`,
    risks: [
      ...(!opportunity.budgetMax ? ["Batas atas budget belum tersedia"] : []),
      ...(!opportunity.timelineEnd ? ["Target timeline belum lengkap"] : []),
      ...(!opportunity.decisionMakerInvolved ? ["Keterlibatan decision maker belum terkonfirmasi"] : []),
    ],
    recommendedReviewPoints: [
      "Validasi outcome bisnis dan kriteria keberhasilan",
      "Konfirmasi batas scope, integrasi, serta dependensi",
      "Pastikan budget, timeline, dan proses keputusan",
    ],
  };
  return executeStructuredAI(provider, {
    feature: "opportunity_summary",
    organizationId: actor.organizationId,
    userId: actor.userId,
    entityType: "Opportunity",
    entityId: opportunityId,
  }, {
    schema: opportunitySummarySchema,
    schemaName: "opportunity_summary",
    system: systemInstruction,
    prompt: contextualPrompt("Ringkas Opportunity berikut menggunakan data Provider-safe.", opportunityContext(match)),
    fallback,
  });
}

export async function generateMatchExplanation(
  actor: Actor,
  opportunityId: string,
  provider: AIProvider = getAIProvider(),
) {
  const match = await getAuthorizedOpportunityMatch(actor.organizationId, opportunityId);
  const factors = factorEntries(match);
  const strongest = factors.filter((item) => item.score >= item.weight * 0.7).slice(0, 4);
  const gaps = factors.filter((item) => item.score < item.weight * 0.6).slice(0, 4);
  const fallback: MatchExplanation = {
    score: match.totalScore,
    summary: `Match Score deterministik ${match.totalScore}% berdasarkan delapan faktor V1 dan algorithm ${match.algorithmVersion}.`,
    strongestFactors: strongest.length
      ? strongest.map((item) => `${item.label}: ${item.score}/${item.weight}`)
      : ["Belum ada faktor yang mencapai ambang kuat"],
    gaps: gaps.length
      ? gaps.map((item) => `${item.label}: ${item.score}/${item.weight}`)
      : ["Tidak ada gap material pada faktor deterministik"],
    recommendedEvidence: [
      "Tunjukkan portfolio yang paling relevan",
      "Validasi kapasitas dan availability tim",
      "Konfirmasi pendekatan terhadap budget dan timeline",
    ],
  };
  const immutableScoreSchema = matchExplanationSchema.extend({
    score: z.literal(match.totalScore),
  });
  return executeStructuredAI(provider, {
    feature: "match_explanation",
    organizationId: actor.organizationId,
    userId: actor.userId,
    entityType: "Opportunity",
    entityId: opportunityId,
  }, {
    schema: immutableScoreSchema,
    schemaName: "match_explanation",
    system: `${systemInstruction}\nMatch Score bersifat deterministik. Jangan mengubah angka score yang diberikan.`,
    prompt: contextualPrompt("Jelaskan alasan Match Score tanpa menghitung ulang score.", {
      score: match.totalScore,
      algorithmVersion: match.algorithmVersion,
      factors,
      opportunity: opportunityContext(match),
    }),
    fallback,
  });
}

export async function generateMeetingPrep(
  actor: Actor,
  meetingId: string,
  provider: AIProvider = getAIProvider(),
) {
  const meeting = await getAuthorizedMeeting(actor, meetingId);
  const counterpart = getMeetingCounterpart(meeting, actor.organizationId);
  const portfolios = meeting.introduction?.portfolios.map((item) => item.portfolio.title) ?? [];
  const opportunity = meeting.opportunity;
  const fallback: MeetingPrep = {
    companySnapshot: counterpart
      ? `${counterpart.name}${counterpart.city ? `, ${counterpart.city}` : ""}. ${counterpart.description ?? "Profil ringkas belum tersedia."}`
      : "Identitas counterpart belum tersedia pada konteks meeting ini.",
    opportunitySummary: opportunity?.problemStatement ?? "Opportunity belum terhubung.",
    likelyPainPoints: opportunity
      ? [opportunity.problemStatement, ...opportunity.requirements.map((item) => item.label)].slice(0, 8)
      : ["Pain point perlu digali dalam meeting"],
    stakeholders: meeting.participants.map((item) => `${item.name}${item.role ? ` — ${item.role}` : ""}`),
    recommendedDiscoveryQuestions: [
      "Outcome bisnis apa yang paling menentukan keberhasilan proyek?",
      "Siapa yang menyetujui scope, budget, dan keputusan akhir?",
      "Apa dependensi, integrasi, serta risiko implementasi utama?",
      "Kapan solusi perlu menghasilkan dampak pertama?",
    ],
    relevantPortfolio: portfolios.length ? portfolios : ["Belum ada portfolio yang ditautkan ke Introduction"],
    potentialObjections: [
      "Kesesuaian solusi dengan proses yang berjalan",
      "Risiko implementasi dan adopsi pengguna",
      "Kesesuaian biaya dengan outcome bisnis",
    ],
    desiredOutcome: "Menyepakati problem, decision process, scope awal, dan next step yang memiliki owner serta tanggal.",
  };
  return executeStructuredAI(provider, {
    feature: "meeting_prep",
    organizationId: actor.organizationId,
    userId: actor.userId,
    entityType: "Meeting",
    entityId: meetingId,
  }, {
    schema: meetingPrepSchema,
    schemaName: "meeting_prep",
    system: systemInstruction,
    prompt: contextualPrompt("Siapkan salesperson untuk meeting berikut.", meeting),
    fallback,
  });
}

export async function generateDiscoveryAnalysis(
  actor: Actor,
  meetingId: string,
  notes: string,
  provider: AIProvider = getAIProvider(),
) {
  const meeting = await getAuthorizedMeeting(actor, meetingId);
  const fallback = discoveryFallback(notes);
  return executeStructuredAI(provider, {
    feature: "discovery_analysis",
    organizationId: actor.organizationId,
    userId: actor.userId,
    entityType: "Meeting",
    entityId: meetingId,
  }, {
    schema: discoveryAnalysisSchema,
    schemaName: "discovery_analysis",
    system: systemInstruction,
    prompt: contextualPrompt("Analisis catatan discovery. Jangan menganggap informasi yang tidak tertulis sebagai fakta.", {
      meeting: { id: meeting.id, title: meeting.title, opportunity: meeting.opportunity?.title },
      notes,
    }),
    fallback,
  });
}

export async function generateFollowUpDraft(
  actor: Actor,
  conversationId: string,
  notes: string,
  tone: "PROFESSIONAL" | "CONCISE" | "CONSULTATIVE",
  provider: AIProvider = getAIProvider(),
) {
  const conversation = await getAuthorizedConversation(actor, conversationId);
  const counterpart = conversation.participants.find((item) => item.organizationId !== actor.organizationId);
  const fallback: FollowUpDraft = {
    subject: `Tindak lanjut: ${conversation.opportunity?.title ?? "diskusi TemuClient"}`,
    body: `Halo ${counterpart?.user.name ?? "Tim"},\n\nTerima kasih atas diskusinya. ${notes || "Kami merangkum konteks dan akan menindaklanjuti poin yang telah dibahas."}\n\nMohon konfirmasi bila ada bagian yang perlu disesuaikan. Setelah itu, kami mengusulkan menyepakati next step beserta owner dan target waktunya.\n\nSalam,`,
    reviewChecklist: [
      "Pastikan ringkasan sesuai hasil percakapan",
      "Tambahkan next step, owner, dan tanggal yang benar",
      "Hapus informasi sensitif yang tidak perlu dikirim",
    ],
    requiresReview: true,
  };
  return executeStructuredAI(provider, {
    feature: "follow_up",
    organizationId: actor.organizationId,
    userId: actor.userId,
    entityType: "Conversation",
    entityId: conversationId,
  }, {
    schema: followUpDraftSchema,
    schemaName: "follow_up_draft",
    system: `${systemInstruction}\nBuat draft saja. Jangan mengklaim bahwa pesan telah atau akan dikirim. Tone: ${tone}.`,
    prompt: contextualPrompt("Buat draft follow-up yang dapat diedit pengguna.", {
      opportunity: conversation.opportunity?.title,
      counterpart: counterpart?.user.name,
      notes,
    }),
    fallback,
  });
}

export async function generateProposalOutline(
  actor: Actor,
  dealId: string,
  notes: string,
  provider: AIProvider = getAIProvider(),
) {
  const deal = await getAuthorizedDeal(actor, dealId, true);
  const fallback: ProposalOutline = {
    problem: deal.opportunity.problemStatement,
    objective: deal.opportunity.businessObjective ?? "Validasi objective bisnis bersama Buyer.",
    recommendedSolution: ["Susun solusi berdasarkan kebutuhan tervalidasi", "Definisikan pendekatan delivery dan governance"],
    scope: deal.opportunity.requirements.length
      ? deal.opportunity.requirements.map((item) => item.label)
      : ["Scope rinci perlu dikonfirmasi"],
    timeline: [formatTimeline(deal.opportunity.timelineStart, deal.opportunity.timelineEnd)],
    deliverables: ["Deliverable perlu dipetakan terhadap outcome dan acceptance criteria"],
    commercialStructure: [`Acuan awal: ${formatRange(deal.opportunity.budgetMin, deal.opportunity.budgetMax, deal.currency)}`],
    assumptions: ["Final scope, timeline, dan commercial terms memerlukan persetujuan kedua pihak", ...(notes ? [notes] : [])],
    requiresReview: true,
  };
  return executeStructuredAI(provider, {
    feature: "proposal_outline",
    organizationId: actor.organizationId,
    userId: actor.userId,
    entityType: "Deal",
    entityId: dealId,
  }, {
    schema: proposalOutlineSchema,
    schemaName: "proposal_outline",
    system: `${systemInstruction}\nBuat outline proposal saja; jangan membuat atau mengirim Proposal.`,
    prompt: contextualPrompt("Susun outline proposal yang dapat diedit pengguna.", { deal, notes }),
    fallback,
  });
}

export async function generateDealHealth(
  actor: Actor,
  dealId: string,
  provider: AIProvider = getAIProvider(),
) {
  const deal = await getAuthorizedDeal(actor, dealId, false);
  const fallback = dealHealthFallback(deal);
  return executeStructuredAI(provider, {
    feature: "deal_health",
    organizationId: actor.organizationId,
    userId: actor.userId,
    entityType: "Deal",
    entityId: dealId,
  }, {
    schema: dealHealthSchema,
    schemaName: "deal_health",
    system: `${systemInstruction}\nScore adalah indikator bantuan, bukan probabilitas kepastian Deal akan dimenangkan.`,
    prompt: contextualPrompt("Nilai Deal Health dari sinyal operasional yang tersedia.", deal),
    fallback,
  });
}

export async function getAISalesContext(actor: Actor) {
  const [opportunities, meetings, deals, conversations, executions] = await Promise.all([
    db.opportunityMatch.findMany({
      where: { providerOrganizationId: actor.organizationId, opportunity: { status: "ACTIVE" } },
      select: { opportunityId: true, totalScore: true, opportunity: { select: { title: true } } },
      orderBy: { totalScore: "desc" },
      take: 30,
    }),
    db.meeting.findMany({
      where: {
        participants: { some: { userId: actor.userId } },
        OR: [
          { introduction: { providerOrganizationId: actor.organizationId } },
          { deal: { providerOrganizationId: actor.organizationId } },
        ],
      },
      select: { id: true, title: true, startsAt: true, status: true },
      orderBy: { startsAt: "desc" },
      take: 30,
    }),
    db.deal.findMany({
      where: { providerOrganizationId: actor.organizationId },
      select: { id: true, title: true, stage: true, status: true, ownerUserId: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    db.conversation.findMany({
      where: {
        participants: { some: { userId: actor.userId, organizationId: actor.organizationId } },
        introduction: { providerOrganizationId: actor.organizationId, status: "ACCEPTED" },
      },
      select: { id: true, opportunity: { select: { title: true } } },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    db.aIExecution.findMany({
      where: { organizationId: actor.organizationId, userId: actor.userId },
      select: { id: true, feature: true, provider: true, model: true, status: true, entityType: true, entityId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return {
    opportunities,
    meetings: meetings.map((item) => ({ ...item, startsAt: item.startsAt.toISOString() })),
    deals: deals.map((item) => ({
      ...item,
      canManage: canManageDeal(actor.role, actor.userId, item.ownerUserId),
    })),
    conversations,
    executions: executions.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

async function getAuthorizedOpportunityMatch(organizationId: string, opportunityId: string) {
  const match = await db.opportunityMatch.findFirst({
    where: { opportunityId, providerOrganizationId: organizationId },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          problemStatement: true,
          businessObjective: true,
          budgetMin: true,
          budgetMax: true,
          currency: true,
          timelineStart: true,
          timelineEnd: true,
          city: true,
          remoteAllowed: true,
          decisionMakerInvolved: true,
          intentScore: true,
          intentLevel: true,
          verificationLevel: true,
          status: true,
          serviceCategory: { select: { name: true } },
          industry: { select: { name: true } },
          requirements: { select: { label: true, description: true, priority: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!match)
    throw new DomainError("FORBIDDEN", "Opportunity tidak tersedia untuk organisasi Provider Anda.", 403);
  return match;
}

async function getAuthorizedMeeting(actor: Actor, meetingId: string) {
  const meeting = await db.meeting.findFirst({
    where: {
      id: meetingId,
      participants: { some: { userId: actor.userId } },
      OR: [
        { introduction: { buyerOrganizationId: actor.organizationId } },
        { introduction: { providerOrganizationId: actor.organizationId } },
        { deal: { buyerOrganizationId: actor.organizationId } },
        { deal: { providerOrganizationId: actor.organizationId } },
        { opportunity: { buyerOrganizationId: actor.organizationId } },
      ],
    },
    include: {
      participants: { select: { name: true, role: true, userId: true } },
      opportunity: {
        select: {
          id: true, title: true, problemStatement: true, businessObjective: true,
          budgetMin: true, budgetMax: true, currency: true, timelineStart: true, timelineEnd: true,
          requirements: { select: { label: true, description: true }, orderBy: { sortOrder: "asc" } },
        },
      },
      introduction: {
        include: {
          buyerOrganization: { select: { id: true, name: true, city: true, description: true } },
          providerOrganization: { select: { id: true, name: true, city: true, description: true } },
          portfolios: { include: { portfolio: { select: { title: true, problem: true, outcome: true } } } },
        },
      },
    },
  });
  if (!meeting)
    throw new DomainError("FORBIDDEN", "Anda tidak memiliki akses ke Meeting ini.", 403);
  return meeting;
}

async function getAuthorizedConversation(actor: Actor, conversationId: string) {
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId: actor.userId, organizationId: actor.organizationId } },
      introduction: { status: "ACCEPTED" },
    },
    include: {
      opportunity: { select: { id: true, title: true, problemStatement: true } },
      participants: {
        select: { organizationId: true, user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!conversation)
    throw new DomainError("FORBIDDEN", "Anda tidak memiliki akses ke Conversation ini.", 403);
  return conversation;
}

async function getAuthorizedDeal(actor: Actor, dealId: string, requireManage: boolean) {
  const deal = await db.deal.findFirst({
    where: { id: dealId, providerOrganizationId: actor.organizationId },
    include: {
      opportunity: {
        select: {
          title: true, problemStatement: true, businessObjective: true, budgetMin: true, budgetMax: true,
          timelineStart: true, timelineEnd: true,
          requirements: { select: { label: true, description: true }, orderBy: { sortOrder: "asc" } },
        },
      },
      buyerOrganization: { select: { name: true, city: true } },
      activities: { select: { type: true, title: true, occurredAt: true }, orderBy: { occurredAt: "desc" }, take: 20 },
      meetings: { select: { status: true, startsAt: true }, orderBy: { startsAt: "desc" }, take: 10 },
      proposals: { select: { status: true, submittedAt: true }, orderBy: { version: "desc" }, take: 5 },
    },
  });
  if (!deal)
    throw new DomainError("FORBIDDEN", "Deal tidak tersedia untuk organisasi Anda.", 403);
  if (requireManage && !canManageDeal(actor.role, actor.userId, deal.ownerUserId))
    throw new DomainError("FORBIDDEN", "Hanya Owner, Admin, atau Sales pemilik Deal yang dapat membuat outline Proposal.", 403);
  return deal;
}

function opportunityContext(match: Awaited<ReturnType<typeof getAuthorizedOpportunityMatch>>) {
  const opportunity = match.opportunity;
  return {
    title: opportunity.title,
    service: opportunity.serviceCategory?.name,
    industry: opportunity.industry?.name,
    problemStatement: opportunity.problemStatement,
    businessObjective: opportunity.businessObjective,
    requirements: opportunity.requirements,
    budget: formatRange(opportunity.budgetMin, opportunity.budgetMax, opportunity.currency),
    timeline: formatTimeline(opportunity.timelineStart, opportunity.timelineEnd),
    location: opportunity.city,
    remoteAllowed: opportunity.remoteAllowed,
    intent: { score: opportunity.intentScore, level: opportunity.intentLevel },
    verificationLevel: opportunity.verificationLevel,
  };
}

function factorEntries(match: Awaited<ReturnType<typeof getAuthorizedOpportunityMatch>>) {
  return [
    { label: "Service Compatibility", score: match.serviceScore, weight: 25 },
    { label: "Industry Experience", score: match.industryScore, weight: 15 },
    { label: "Budget Compatibility", score: match.budgetScore, weight: 15 },
    { label: "Portfolio Relevance", score: match.portfolioScore, weight: 15 },
    { label: "Technology Capability", score: match.technologyScore, weight: 10 },
    { label: "Company Capacity", score: match.capacityScore, weight: 10 },
    { label: "Location", score: match.locationScore, weight: 5 },
    { label: "Availability", score: match.availabilityScore, weight: 5 },
  ];
}

function getMeetingCounterpart(
  meeting: Awaited<ReturnType<typeof getAuthorizedMeeting>>,
  organizationId: string,
) {
  const introduction = meeting.introduction;
  if (!introduction) return null;
  return introduction.buyerOrganization.id === organizationId
    ? introduction.providerOrganization
    : introduction.buyerOrganization;
}

function discoveryFallback(notes: string): DiscoveryAnalysis {
  const excerpts = notes.split(/[.!?\n]+/).map((item) => item.trim()).filter((item) => item.length > 8).slice(0, 8);
  const find = (pattern: RegExp, fallback: string) => excerpts.filter((item) => pattern.test(item)).slice(0, 4).length
    ? excerpts.filter((item) => pattern.test(item)).slice(0, 4)
    : [fallback];
  return {
    painPoints: find(/masalah|kendala|sulit|lambat|manual|risiko/i, "Pain point belum dinyatakan secara eksplisit"),
    buyingSignals: find(/setuju|butuh|prioritas|anggaran|budget|target|proposal/i, "Buying signal belum cukup jelas"),
    decisionMakers: find(/direktur|cto|ceo|cfo|procurement|decision|menyetujui/i, "Decision maker belum teridentifikasi"),
    budget: find(/budget|anggaran|rp\s?\d|juta|miliar/i, "Budget belum terkonfirmasi")[0]!,
    timeline: find(/minggu|bulan|kuartal|target|deadline|timeline/i, "Timeline belum terkonfirmasi")[0]!,
    risks: find(/risiko|belum|tergantung|kendala|keberatan/i, "Risiko perlu dikonfirmasi pada follow-up"),
    nextBestAction: "Konfirmasi ringkasan discovery, gap informasi, decision process, dan next step bertanggal kepada seluruh pihak.",
  };
}

function dealHealthFallback(deal: Awaited<ReturnType<typeof getAuthorizedDeal>>): DealHealth {
  let score = 25;
  const positiveSignals: string[] = [];
  const risks: string[] = [];
  if (deal.estimatedValue !== null) { score += 10; positiveSignals.push("Estimated value sudah dicatat"); }
  if (deal.expectedCloseDate) { score += 10; positiveSignals.push("Expected close date tersedia"); }
  else risks.push("Expected close date belum ditentukan");
  if (deal.meetings.some((item) => item.status === "COMPLETED")) { score += 15; positiveSignals.push("Sudah ada meeting yang selesai"); }
  else risks.push("Belum ada meeting yang selesai");
  if (deal.proposals.some((item) => ["SUBMITTED", "ACCEPTED"].includes(item.status))) { score += 15; positiveSignals.push("Proposal sudah disubmit"); }
  else if (["PROPOSAL", "NEGOTIATION"].includes(deal.stage)) risks.push("Proposal belum disubmit");
  const recentActivity = deal.activities[0]?.occurredAt;
  if (recentActivity && Date.now() - recentActivity.getTime() <= 14 * 86_400_000) { score += 10; positiveSignals.push("Ada aktivitas dalam 14 hari terakhir"); }
  else risks.push("Tidak ada aktivitas terbaru dalam 14 hari");
  if (deal.stage === "NEGOTIATION") score += 10;
  if (deal.status !== "OPEN") risks.push("Deal sudah berada pada status final");
  return {
    score: Math.max(0, Math.min(100, score)),
    positiveSignals: positiveSignals.length ? positiveSignals : ["Deal sudah terhubung ke relasi TemuClient"],
    risks: risks.length ? risks : ["Tidak ada risiko operasional yang terdeteksi dari data tersedia"],
    nextBestAction: nextActionByStage(deal.stage),
    confidence: deal.activities.length >= 3 && deal.meetings.length ? "HIGH" : deal.activities.length ? "MEDIUM" : "LOW",
  };
}

function nextActionByStage(stage: string) {
  if (stage === "INTRODUCTION") return "Jadwalkan discovery dan sepakati agenda bersama Buyer.";
  if (stage === "DISCOVERY") return "Konfirmasi temuan discovery serta scope yang dapat dijadikan Proposal.";
  if (stage === "PROPOSAL") return "Jadwalkan review Proposal dengan decision maker dan procurement.";
  if (stage === "NEGOTIATION") return "Konfirmasi isu komersial terbuka, owner, dan target keputusan.";
  return "Dokumentasikan hasil dan pembelajaran dari Deal.";
}

function contextualPrompt(task: string, context: unknown) {
  return `${task}\n\nCONTEXT_JSON:\n${JSON.stringify(context, (_key, value) => typeof value === "bigint" ? value.toString() : value)}`;
}

function formatRange(min: bigint | null, max: bigint | null, currency: string) {
  if (min === null && max === null) return "Budget belum diungkapkan";
  const format = (value: bigint) => `${currency} ${value.toLocaleString("id-ID")}`;
  if (min !== null && max !== null) return `${format(min)}–${format(max)}`;
  return min !== null ? `Mulai ${format(min)}` : `Hingga ${format(max!)}`;
}

function formatTimeline(start: Date | null, end: Date | null) {
  if (!start && !end) return "Timeline belum ditentukan";
  const format = (date: Date) => date.toLocaleDateString("id-ID", { month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  if (start && end) return `${format(start)}–${format(end)}`;
  return start ? `Mulai ${format(start)}` : `Target selesai ${format(end!)}`;
}

export type AISalesContext = Awaited<ReturnType<typeof getAISalesContext>>;
