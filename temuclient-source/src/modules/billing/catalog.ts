import type { SubscriptionPlan } from "@/generated/prisma/enums";
import { getServerEnv } from "@/lib/env";

export type SubscriptionPlanOffer = {
  plan: SubscriptionPlan;
  audience: "ALL" | "PROVIDER";
  name: string;
  priceMonthlyIdr: number | null;
  availability: "AVAILABLE" | "COMING_SOON" | "CONTACT";
  description: string;
  features: string[];
};

export function getSubscriptionCatalog(): SubscriptionPlanOffer[] {
  const env = getServerEnv();
  return [
    {
      plan: "FREE",
      audience: "ALL",
      name: "Free",
      priceMonthlyIdr: 0,
      availability: "AVAILABLE",
      description: "Untuk mencoba alur TemuClient tanpa biaya.",
      features: ["Profil perusahaan", "Akses dasar", "Basic matching"],
    },
    {
      plan: "PRO",
      audience: "PROVIDER",
      name: "Pro",
      priceMonthlyIdr: env.PRO_MONTHLY_PRICE_IDR ?? null,
      availability: env.PAID_SUBSCRIPTIONS_ENABLED ? "AVAILABLE" : "COMING_SOON",
      description: "Untuk tim sales yang aktif membangun pipeline.",
      features: ["Akses opportunity lebih luas", "Match intelligence", "AI Sales Assistant"],
    },
    {
      plan: "BUSINESS",
      audience: "PROVIDER",
      name: "Business",
      priceMonthlyIdr: null,
      availability: "CONTACT",
      description: "Untuk kebutuhan multi-team dan tata kelola khusus.",
      features: ["Semua fitur Pro", "Kursi tim lebih banyak", "Dukungan prioritas"],
    },
  ];
}
