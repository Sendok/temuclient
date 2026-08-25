import { MATCHING_ALGORITHM_VERSION, MATCH_WEIGHTS, type MatchingEngine, type MatchOpportunityInput, type MatchProviderInput, type MatchReason } from "@/modules/matching/types";

const normalize = (value: string | null) => value?.trim().toLocaleLowerCase("id-ID") ?? "";
const overlaps = (aMin: bigint | null, aMax: bigint | null, bMin: bigint | null, bMax: bigint | null) =>
  (aMax === null || bMin === null || aMax >= bMin) && (bMax === null || aMin === null || bMax >= aMin);

export const deterministicMatchingEngine: MatchingEngine = {
  calculate(opportunity, provider) {
    const service = scoreService(opportunity, provider);
    const industry = scoreIndustry(opportunity, provider);
    const budget = scoreBudget(opportunity, provider);
    const portfolio = scorePortfolio(opportunity, provider);
    const technology = scoreTechnology(opportunity, provider);
    const capacity = scoreCapacity(provider);
    const location = scoreLocation(opportunity, provider);
    const availability = scoreAvailability(provider);
    const reasons = [service, industry, budget, portfolio, technology, capacity, location, availability];
    const factors = Object.fromEntries(reasons.map((reason) => [reason.factor, reason.score])) as Record<MatchReason["factor"], number>;
    return { totalScore: reasons.reduce((total, reason) => total + reason.score, 0), factors, reasons, algorithmVersion: MATCHING_ALGORITHM_VERSION, calculatedAt: new Date() };
  },
};

function reason(factor: MatchReason["factor"], score: number, message: string): MatchReason { return { factor, score, maximum: MATCH_WEIGHTS[factor], message }; }
function scoreService(opportunity: MatchOpportunityInput, provider: MatchProviderInput) { const exact = Boolean(opportunity.serviceCategoryId && provider.services.some((item) => item.serviceCategoryId === opportunity.serviceCategoryId)); return reason("service", exact ? 25 : 0, exact ? "Layanan provider sesuai dengan kebutuhan utama." : "Layanan utama belum sesuai langsung."); }
function scoreIndustry(opportunity: MatchOpportunityInput, provider: MatchProviderInput) { const direct = Boolean(opportunity.industryId && provider.industryIds.includes(opportunity.industryId)); const portfolio = Boolean(opportunity.industryId && provider.portfolios.some((item) => item.industryId === opportunity.industryId)); const score = direct ? 15 : portfolio ? 9 : 0; return reason("industry", score, direct ? "Provider memiliki pengalaman langsung di industri ini." : portfolio ? "Portfolio menunjukkan pengalaman relevan di industri ini." : "Pengalaman industri langsung belum terlihat."); }
function scoreBudget(opportunity: MatchOpportunityInput, provider: MatchProviderInput) { const service = provider.services.find((item) => item.serviceCategoryId === opportunity.serviceCategoryId); if (!service || (opportunity.budgetMin === null && opportunity.budgetMax === null) || (service.minProjectValue === null && service.maxProjectValue === null)) return reason("budget", 8, "Rentang nilai proyek belum lengkap; kecocokan dinilai netral."); const compatible = overlaps(opportunity.budgetMin, opportunity.budgetMax, service.minProjectValue, service.maxProjectValue); return reason("budget", compatible ? 15 : 0, compatible ? "Budget beririsan dengan rentang proyek provider." : "Budget berada di luar rentang proyek provider."); }
function scorePortfolio(opportunity: MatchOpportunityInput, provider: MatchProviderInput) { if (!provider.portfolios.length) return reason("portfolio", 0, "Belum ada portfolio terpublikasi yang dapat dinilai."); const exactIndustry = Boolean(opportunity.industryId && provider.portfolios.some((item) => item.industryId === opportunity.industryId)); const opportunityTerms = tokenize(opportunity.text); const keywordOverlap = provider.portfolios.some((item) => [...tokenize(item.text)].some((term) => opportunityTerms.has(term))); const score = exactIndustry && keywordOverlap ? 15 : exactIndustry ? 11 : keywordOverlap ? 7 : 3; return reason("portfolio", score, score >= 11 ? "Portfolio sangat relevan dengan konteks kebutuhan." : score >= 7 ? "Portfolio memiliki kesamaan masalah atau solusi." : "Provider memiliki bukti delivery, dengan relevansi terbatas."); }
function scoreTechnology(opportunity: MatchOpportunityInput, provider: MatchProviderInput) { const text = normalize(opportunity.text); const names = provider.portfolios.flatMap((item) => item.technologyNames); const explicit = names.some((name) => text.includes(normalize(name))); const score = explicit ? 10 : names.length ? 5 : 0; return reason("technology", score, explicit ? "Teknologi yang dibutuhkan tercakup dalam portfolio." : names.length ? "Provider memiliki bukti kemampuan teknologi." : "Bukti kemampuan teknologi belum tersedia."); }
function scoreCapacity(provider: MatchProviderInput) { const score = provider.teamCapacity === null ? 3 : provider.teamCapacity >= 5 ? 10 : provider.teamCapacity >= 2 ? 6 : 2; return reason("capacity", score, score === 10 ? "Kapasitas tim memadai untuk kebutuhan proyek." : "Kapasitas tim perlu dikonfirmasi lebih lanjut."); }
function scoreLocation(opportunity: MatchOpportunityInput, provider: MatchProviderInput) { const city = normalize(opportunity.city) && normalize(opportunity.city) === normalize(provider.city); const province = normalize(opportunity.province) && normalize(opportunity.province) === normalize(provider.province); const score = city ? 5 : province ? 3 : opportunity.remoteAllowed ? 2 : 0; return reason("location", score, city ? "Provider berada di kota yang sama." : province ? "Provider berada di provinsi yang sama." : opportunity.remoteAllowed ? "Kebutuhan mendukung delivery remote." : "Lokasi provider tidak sesuai preferensi."); }
function scoreAvailability(provider: MatchProviderInput) { const score = provider.availability === "AVAILABLE" ? 5 : provider.availability === "LIMITED" ? 3 : 0; return reason("availability", score, score === 5 ? "Provider siap menerima proyek baru." : score === 3 ? "Ketersediaan provider terbatas." : "Provider belum tersedia untuk proyek baru."); }
function tokenize(value: string) { return new Set(normalize(value).split(/[^a-z0-9]+/).filter((term) => term.length >= 5)); }

export function isBudgetViable(opportunity: Pick<MatchOpportunityInput, "budgetMin" | "budgetMax">, service: MatchProviderInput["services"][number]) { return (opportunity.budgetMin === null && opportunity.budgetMax === null) || (service.minProjectValue === null && service.maxProjectValue === null) || overlaps(opportunity.budgetMin, opportunity.budgetMax, service.minProjectValue, service.maxProjectValue); }
