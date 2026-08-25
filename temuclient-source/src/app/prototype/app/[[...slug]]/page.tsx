import { AppPrototype } from "@/components/prototype/app-prototype";

export default async function PrototypeAppPage({ params, searchParams }: { params: Promise<{ slug?: string[] }>; searchParams: Promise<{ persona?: string }> }) {
  const [{ slug = [] }, query] = await Promise.all([params, searchParams]);
  const inferredBuyer = slug.includes("requirements") || slug.includes("providers");
  const persona = query.persona === "buyer" || inferredBuyer ? "buyer" : "provider";
  return <AppPrototype persona={persona} slug={slug} />;
}
