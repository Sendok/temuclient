import { getServerEnv } from "@/lib/env";

export interface BillingProvider {
  readonly mode: "sandbox" | "live";
  readonly name: string;
}

export function getBillingProvider(): BillingProvider {
  const provider = getServerEnv().BILLING_PROVIDER;
  const env = getServerEnv();
  return {
    name: provider,
    mode: provider === "midtrans" && env.MIDTRANS_IS_PRODUCTION ? "live" : "sandbox",
  };
}
