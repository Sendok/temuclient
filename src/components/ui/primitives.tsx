import type { HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border bg-surface", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "info" }) {
  const tones = {
    neutral: "border-border-default bg-surface-subtle text-text-secondary",
    brand: "border-brand-100 bg-brand-50 text-brand-700",
    success: "border-success-100 bg-success-50 text-success-700",
    warning: "border-warning-100 bg-warning-50 text-warning-700",
    danger: "border-danger-100 bg-danger-50 text-danger-700",
    info: "border-info-100 bg-info-50 text-info-700",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone], className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("min-h-11 w-full rounded-md border bg-surface px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("min-h-11 rounded-md border bg-surface px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100", className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-surface-muted", className)} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <Card className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><div className="mb-4 size-10 rounded-full border bg-surface-subtle" /><h3 className="font-semibold">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p>{action && <div className="mt-5">{action}</div>}</Card>;
}

export function ErrorState({ title = "Terjadi kendala", description = "Data belum dapat dimuat. Silakan coba kembali." }: { title?: string; description?: string }) {
  return <Card className="border-danger-100 bg-danger-50 p-6"><p className="font-semibold text-danger-700">{title}</p><p className="mt-1 text-sm text-text-secondary">{description}</p><button className="mt-4 text-sm font-semibold text-danger-700 underline">Coba lagi</button></Card>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold tracking-tight">{title}</h2>{description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}</div>{action}</div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">{eyebrow}</p>}<h1 className="text-2xl font-semibold tracking-[-0.025em]">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{description}</p>}</div>{action}</header>;
}
