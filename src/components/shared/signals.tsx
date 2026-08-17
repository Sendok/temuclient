import { CheckCircle2, Circle } from "lucide-react";

import { Badge, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function MatchScore({ score, compact = false }: { score: number; compact?: boolean }) {
  const label = score >= 90 ? "Excellent Match" : score >= 80 ? "Strong Match" : score >= 65 ? "Good Match" : "Moderate Match";
  return <div className={cn("tabular-nums", compact && "flex items-baseline gap-2")}><p className={cn("font-semibold tracking-tight text-brand-700", compact ? "text-xl" : "text-3xl")}>{score}%</p><p className="mt-0.5 text-xs font-medium text-text-secondary">{label}</p></div>;
}

export function BuyerIntent({ score, compact = false }: { score: number; compact?: boolean }) {
  const label = score >= 80 ? "Very High Intent" : score >= 60 ? "High Intent" : score >= 40 ? "Medium Intent" : "Low Intent";
  return <div className={cn("tabular-nums", compact && "flex items-baseline gap-2")}><p className={cn("font-semibold tracking-tight text-success-700", compact ? "text-xl" : "text-3xl")}>{score}</p><p className="mt-0.5 text-xs font-medium text-text-secondary">{label}</p></div>;
}

export function VerificationSummary({ score = 4, expanded = false }: { score?: number; expanded?: boolean }) {
  if (!expanded) return <Badge tone="success"><CheckCircle2 className="mr-1 size-3.5" />Verified {score}/5</Badge>;
  const labels = ["Company", "Contact", "Requirement", "Budget", "Decision Maker"];
  return <div className="space-y-2">{labels.map((label, index) => <div className="flex items-center gap-2 text-sm" key={label}>{index < score ? <CheckCircle2 className="size-4 text-success-600" /> : <Circle className="size-4 text-text-muted" />}<span className={index < score ? "text-text-primary" : "text-text-secondary"}>{label}</span></div>)}</div>;
}

export function StatCard({ label, value, delta, detail }: { label: string; value: string; delta?: string; detail?: string }) {
  return <Card className="p-4"><p className="text-xs font-medium text-text-secondary">{label}</p><div className="mt-2 flex items-end justify-between gap-2"><p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>{delta && <Badge tone="success">{delta}</Badge>}</div>{detail && <p className="mt-2 text-xs text-text-muted">{detail}</p>}</Card>;
}

export function NextBestAction({ title, description, meta }: { title: string; description: string; meta: string }) {
  return <div className="group flex items-start gap-3 border-b py-4 last:border-0"><span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700">→</span><div className="min-w-0"><p className="text-sm font-semibold group-hover:text-brand-700">{title}</p><p className="mt-1 text-sm text-text-secondary">{description}</p><p className="mt-1 text-xs text-text-muted">{meta}</p></div></div>;
}
