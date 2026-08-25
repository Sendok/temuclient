"use client";
/* eslint-disable @next/next/no-img-element -- Midtrans returns an expiring, provider-hosted QR image URL that cannot use a fixed Next image allowlist. */

import { Check, LoaderCircle, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import type { getOrganizationSubscription } from "@/modules/billing/service";

type SubscriptionData = Awaited<ReturnType<typeof getOrganizationSubscription>>;

function rupiah(amount: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(amount));
}

export function SubscriptionSettings({ subscription, canManage, isBuyer }: { subscription: SubscriptionData; canManage: boolean; isBuyer: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const limits = subscription.entitlements;
  const pending = subscription.payments.find((payment) => payment.status === "PENDING" && new Date(payment.expiresAt) > new Date());

  async function checkout() {
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/v1/billing/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan: "PRO", billingPeriodMonths: 1 }) });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error?.message ?? "Tagihan QRIS belum dapat dibuat.");
    else {
      setMessage("QRIS berhasil dibuat. Selesaikan pembayaran sebelum kedaluwarsa.");
      router.refresh();
    }
    setSubmitting(false);
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Pengaturan" title="Paket & pembayaran" description="Kelola paket TemuClient. Tidak ada komisi atau potongan dari nilai deal Anda." />
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Paket efektif</p><p className="mt-2 text-2xl font-semibold">{subscription.effectivePlan}</p><p className="mt-2 text-sm text-text-secondary">Subscription tersimpan: {subscription.plan} • status {subscription.status} • {subscription.provider}</p></div><Badge tone={subscription.billingMode === "live" ? "success" : "warning"}>{subscription.billingMode === "live" ? "Pembayaran aktif" : "Sandbox — bukan pembayaran nyata"}</Badge></div>
      <div className="mt-6 grid gap-3 border-t pt-5 sm:grid-cols-2"><Detail label="Akses opportunity / bulan" value={limits.opportunityAccessPerMonth?.toString() ?? "Tanpa batas"} /><Detail label="Permintaan AI / jam" value={String(limits.aiRequestsPerHour)} /><Detail label="Kursi tim" value={limits.teamSeats?.toString() ?? "Tanpa batas"} /><Detail label="Analitik lanjutan" value={limits.advancedAnalytics ? "Termasuk" : "Belum termasuk"} /></div>
      {!subscription.paymentsEnabled && <p className="mt-5 rounded-md bg-warning-50 p-4 text-sm text-warning-700">TemuClient masih dalam tahap awal. Semua pengguna dapat mulai gratis; paket berbayar dan QRIS belum menerima pembayaran nyata.</p>}
    </Card>

    {isBuyer ? <Card className="p-6"><h2 className="text-lg font-semibold">Akun pencari vendor tetap gratis</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Buat kebutuhan, terima pilihan penyedia jasa, dan kendalikan perkenalan tanpa biaya langganan.</p></Card> : <div className="grid gap-4 lg:grid-cols-3">{subscription.catalog.map((offer) => <Card className={offer.plan === subscription.effectivePlan ? "border-brand-400 p-5 ring-1 ring-brand-100" : "p-5"} key={offer.plan}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold tracking-widest text-brand-600">{offer.plan}</p><h2 className="mt-3 text-xl font-semibold">{offer.name}</h2></div>{offer.plan === subscription.effectivePlan && <Badge tone="brand">Aktif</Badge>}</div><p className="mt-4 text-2xl font-semibold">{offer.priceMonthlyIdr === 0 ? "Gratis" : offer.priceMonthlyIdr ? `${rupiah(offer.priceMonthlyIdr)}/bulan` : offer.availability === "CONTACT" ? "Hubungi kami" : "Segera hadir"}</p><p className="mt-3 min-h-12 text-sm leading-6 text-text-secondary">{offer.description}</p><ul className="mt-5 space-y-2 border-t pt-5">{offer.features.map((feature) => <li className="flex gap-2 text-sm" key={feature}><Check className="mt-0.5 size-4 shrink-0 text-success-600" />{feature}</li>)}</ul>{offer.plan === "PRO" && offer.availability === "AVAILABLE" && subscription.effectivePlan !== "PRO" && <button className="mt-6 flex min-h-11 w-full items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={!canManage || submitting} onClick={checkout}>{submitting ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Menyiapkan QRIS</> : <><QrCode className="mr-2 size-4" />Bayar dengan QRIS</>}</button>}{offer.availability === "COMING_SOON" && <p className="mt-6 rounded-md bg-surface-subtle p-3 text-center text-sm font-medium text-text-secondary">Segera hadir</p>}{offer.availability === "CONTACT" && <a className="mt-6 flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold" href="mailto:hello@temuclient.com?subject=TemuClient%20Business%20Support">Hubungi kami</a>}</Card>)}</div>}

    {message && <p className="rounded-md border bg-surface p-4 text-sm" role="status">{message}</p>}
    {pending?.qrisImageUrl && <Card className="p-6"><div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]"><div className="rounded-lg border bg-white p-3"><img alt="QRIS untuk pembayaran subscription TemuClient" className="aspect-square w-full object-contain" src={pending.qrisImageUrl} /></div><div><Badge tone="warning">Menunggu pembayaran</Badge><h2 className="mt-3 text-xl font-semibold">Scan QRIS {rupiah(pending.amount)}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Gunakan aplikasi bank atau dompet digital yang mendukung QRIS. Berlaku sampai {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(pending.expiresAt))} WIB.</p><p className="mt-4 text-xs text-text-muted">Paket aktif otomatis hanya setelah status settlement dikonfirmasi server.</p></div></div></Card>}
    {subscription.payments.length > 0 && <Card className="overflow-hidden"><div className="border-b px-5 py-4"><h2 className="font-semibold">Riwayat pembayaran</h2></div><div className="divide-y">{subscription.payments.map((payment) => <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm" key={payment.id}><div><p className="font-medium">{payment.plan} • {rupiah(payment.amount)}</p><p className="mt-1 text-xs text-text-muted">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(payment.createdAt))} • QRIS</p></div><Badge tone={payment.status === "PAID" ? "success" : payment.status === "PENDING" ? "warning" : "neutral"}>{payment.status}</Badge></div>)}</div></Card>}
    {!canManage && !isBuyer && <p className="rounded-md border bg-surface-subtle p-4 text-sm text-text-secondary">Hanya Owner atau Admin organisasi yang dapat mengubah paket dan membuat pembayaran.</p>}
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-surface-subtle p-3"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
