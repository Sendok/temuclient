import { Skeleton } from "@/components/ui/primitives";

export default function PublicFlowLoading() {
  return <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-5 py-10"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-80 max-w-full" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></main>;
}
