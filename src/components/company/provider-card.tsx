"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, MapPin, Star } from "lucide-react";

import { MatchScore } from "@/components/shared/signals";
import { Badge, Card } from "@/components/ui/primitives";
import type { ProviderMatchViewModel } from "@/data/mock/types";

export function ProviderCard({ provider, selected, shortlisted, onCompare, onShortlist }: { provider: ProviderMatchViewModel; selected?: boolean; shortlisted?: boolean; onCompare?: () => void; onShortlist?: () => void }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">{provider.initials}</span><div><Link className="font-semibold hover:text-brand-700" href={`/app/providers/${provider.id}?persona=buyer`}>{provider.name}</Link><p className="mt-1 flex items-center gap-1 text-xs text-text-secondary"><MapPin className="size-3" />{provider.city}</p></div></div><MatchScore compact score={provider.match} /></div><div className="mt-4 flex flex-wrap gap-2">{provider.services.map((service) => <Badge key={service}>{service}</Badge>)}<Badge tone="success"><CheckCircle2 className="mr-1 size-3" />Verified</Badge></div><div className="mt-4 grid grid-cols-2 gap-3 border-y py-4 text-xs text-text-secondary"><span>{provider.experience}</span><span>{provider.projectSize}</span><span className="flex gap-1"><Clock3 className="size-3" />{provider.responseTime}</span><span className="flex gap-1"><Star className="size-3 fill-warning-500 text-warning-500" />{provider.rating}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><Link className="flex min-h-10 items-center justify-center rounded-md border text-xs font-semibold hover:bg-surface-subtle" href={`/app/providers/${provider.id}?persona=buyer`}>Lihat</Link><button className="min-h-10 rounded-md border text-xs font-semibold hover:bg-surface-subtle" onClick={onShortlist}>{shortlisted ? "Shortlisted" : "Shortlist"}</button><button className="min-h-10 rounded-md bg-brand-600 text-xs font-semibold text-white hover:bg-brand-700" onClick={onCompare}>{selected ? "Dipilih" : "Compare"}</button></div></Card>;
}
