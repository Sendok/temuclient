export type ProfileStrengthInput = {
  company: { name: string; description: string | null; city: string | null };
  services: { minProjectValue: bigint | null; maxProjectValue: bigint | null }[];
  industryCount: number;
  portfolioCount: number;
  teamCapacity: number | null;
  availability: string | null;
  emailVerified: boolean;
};

export type ProfileStrength = { percentage: number; missingItems: string[]; nextRecommendedAction: string | null; breakdown: Record<string, number> };

export function calculateProfileStrength(input: ProfileStrengthInput): ProfileStrength {
  const breakdown = {
    companyBasics: input.company.name && input.company.description && input.company.city ? 20 : 0,
    services: input.services.length > 0 ? 20 : 0,
    industries: input.industryCount > 0 ? 10 : 0,
    projectRange: input.services.some((item) => item.minProjectValue !== null && item.maxProjectValue !== null) ? 10 : 0,
    portfolio: input.portfolioCount > 0 ? 25 : 0,
    teamCapacity: input.teamCapacity !== null && input.availability !== null ? 10 : 0,
    verification: input.emailVerified ? 5 : 0,
  };
  const missingItems: string[] = [];
  if (!breakdown.companyBasics) missingItems.push("Lengkapi informasi dasar perusahaan");
  if (!breakdown.services) missingItems.push("Tambahkan minimal satu layanan");
  if (!breakdown.industries) missingItems.push("Pilih industri yang dikuasai");
  if (!breakdown.projectRange) missingItems.push("Tentukan rentang nilai proyek");
  if (!breakdown.portfolio) missingItems.push("Tambahkan portfolio relevan");
  if (!breakdown.teamCapacity) missingItems.push("Isi kapasitas dan availability tim");
  if (!breakdown.verification) missingItems.push("Verifikasi email akun");
  return { percentage: Object.values(breakdown).reduce((sum, value) => sum + value, 0), missingItems, nextRecommendedAction: missingItems[0] ?? null, breakdown };
}
