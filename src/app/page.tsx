import { LandingPage } from "@/components/marketing/landing-page";
import { JsonLd } from "@/components/articles/json-ld";
import { getServerEnv } from "@/lib/env";

export default function HomePage() {
  const baseUrl = getServerEnv().APP_URL;
  return <><JsonLd data={[
    { "@context": "https://schema.org", "@type": "Organization", name: "TemuClient", url: baseUrl, description: "Verified B2B Opportunity Network untuk buyer dan provider Indonesia." },
    { "@context": "https://schema.org", "@type": "WebSite", name: "TemuClient", url: baseUrl, inLanguage: "id-ID" },
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "TemuClient", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Platform untuk qualification, matching, introduction, meeting, dan deal B2B." },
  ]}/><LandingPage /></>;
}
