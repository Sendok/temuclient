import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";
import { getServerEnv } from "@/lib/env";

const geist = Geist({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(getServerEnv().APP_URL),
  title: { default: "TemuClient — Verified B2B Opportunity Network", template: "%s | TemuClient" },
  description: "Temukan opportunity B2B terverifikasi atau provider yang tepat melalui qualification, deterministic matching, dan buyer-controlled introduction.",
  applicationName: "TemuClient",
  alternates: { canonical: "/" },
  keywords: ["opportunity B2B", "vendor teknologi Indonesia", "business matching", "provider B2B", "TemuClient"],
  openGraph: { type: "website", locale: "id_ID", siteName: "TemuClient", title: "TemuClient — Verified B2B Opportunity Network", description: "Need → Qualification → Match → Introduction → Meeting → Deal", url: "/" },
  twitter: { card: "summary_large_image", title: "TemuClient", description: "Verified B2B Opportunity Network" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
