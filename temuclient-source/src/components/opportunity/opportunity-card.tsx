"use client";

import Link from "next/link";
import { Bookmark, Clock3, MapPin, Users } from "lucide-react";

import { BuyerIntent, MatchScore, VerificationSummary } from "@/components/shared/signals";
import { Badge, Card } from "@/components/ui/primitives";
import type { OpportunityCardViewModel } from "@/data/mock/types";
import { cn } from "@/lib/utils";

export function OpportunityCard({ opportunity, compact = false, saved, onSave }: { opportunity: OpportunityCardViewModel; compact?: boolean; saved?: boolean; onSave?: () => void }) {
  return <Card className={cn("group relative overflow-hidden transition hover:border-border-strong", compact ? "p-4" : "p-5")}>
    <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold tracking-[0.1em] text-brand-600">{opportunity.category}</p><Link className="mt-2 block text-base font-semibold tracking-tight hover:text-brand-700" href={`/app/opportunities/${opportunity.id}`}>{opportunity.title}</Link><p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary"><MapPin className="size-3.5" />{opportunity.industry} • {opportunity.city}</p></div><button aria-label={saved ? "Hapus dari tersimpan" : "Simpan opportunity"} className={cn("flex size-10 shrink-0 items-center justify-center rounded-md border transition", saved ? "border-brand-100 bg-brand-50 text-brand-700" : "bg-surface text-text-muted hover:text-text-primary")} onClick={onSave}><Bookmark className={cn("size-4", saved && "fill-current")} /></button></div>
    {!compact && <p className="mt-4 line-clamp-2 text-sm leading-6 text-text-secondary">{opportunity.summary}</p>}
    <div className="mt-4 grid grid-cols-2 gap-3 border-y py-4 text-sm"><div><p className="text-xs text-text-muted">Budget</p><p className="mt-1 font-semibold tabular-nums">{opportunity.budget}</p></div><div><p className="text-xs text-text-muted">Timeline</p><p className="mt-1 flex items-center gap-1.5 font-medium"><Clock3 className="size-3.5" />{opportunity.timeline}</p></div></div>
    <div className="mt-4 grid grid-cols-2 gap-4"><BuyerIntent compact score={opportunity.intent} /><MatchScore compact score={opportunity.match} /></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><VerificationSummary score={opportunity.verified} /><span className="flex items-center gap-1.5 text-xs text-text-muted"><Users className="size-3.5" />{opportunity.interested} provider interested</span></div>
    <div className="mt-4 flex items-center justify-between border-t pt-4"><Badge>{opportunity.published}</Badge><Link className="text-sm font-semibold text-brand-700 hover:underline" href={`/app/opportunities/${opportunity.id}`}>Lihat Opportunity →</Link></div>
  </Card>;
}
