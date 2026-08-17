import { Skeleton } from "@/components/ui/primitives";

export default function AdminLoading() {
  return <main className="space-y-4 p-6"><Skeleton className="h-8 w-64"/><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, index)=><Skeleton className="h-24" key={index}/>)}</div><Skeleton className="h-96"/></main>;
}
