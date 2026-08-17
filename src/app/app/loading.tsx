import { Skeleton } from "@/components/ui/primitives";

export default function AppLoading() {
  return <main className="mx-auto max-w-6xl space-y-5 p-6"><Skeleton className="h-8 w-72"/><Skeleton className="h-4 w-96 max-w-full"/><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index)=><Skeleton className="h-28" key={index}/>)}</div><div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, index)=><Skeleton className="h-72" key={index}/>)}</div></main>;
}
