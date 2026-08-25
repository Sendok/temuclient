"use client";

import { CheckCircle2, Clock3, FileCheck2, ShieldCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import type { VerificationData } from "@/modules/verification/service";

const organizationTypes = [
  { type: "COMPANY", title: "Company", description: "Legal identity dan informasi perusahaan." },
  { type: "DOMAIN", title: "Domain", description: "Kepemilikan domain bisnis perusahaan." },
  { type: "CONTACT", title: "Business Email", description: "Kontak bisnis yang dapat dipertanggungjawabkan." },
] as const;

export function VerificationCenter({ organizationId, canRequest, verifications }: { organizationId: string; canRequest: boolean; verifications: VerificationData[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<string>();
  const latest = new Map(verifications.filter((item) => !item.opportunityId).map((item) => [item.type, item]));

  async function request(type: string) {
    setBusy(type); setMessage(undefined);
    try {
      const response = await fetch("/api/v1/verifications/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, entityType: "ORGANIZATION", entityId: organizationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Permintaan belum dapat dikirim.");
      setMessage(`${type} masuk ke antrean verifikasi.`); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Permintaan belum dapat dikirim."); }
    finally { setBusy(undefined); }
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Trust center" title="Verifikasi Perusahaan" description="Bangun kredibilitas secara bertahap. Setiap sinyal diverifikasi independen dan dapat memiliki status berbeda." />
    {message && <div aria-live="polite" className="rounded-md border bg-surface px-4 py-3 text-sm">{message}</div>}
    <div className="grid gap-4 lg:grid-cols-3">{organizationTypes.map((item) => {
      const current = latest.get(item.type);
      return <Card className="p-5" key={item.type}>
        <div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-md bg-brand-50 text-brand-700"><ShieldCheck className="size-5" /></span><Status status={current?.status} /></div>
        <h2 className="mt-5 font-semibold">{item.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-text-secondary">{item.description}</p>
        {current?.notes && <p className="mt-3 rounded-md bg-warning-50 p-3 text-xs text-warning-700">Catatan reviewer: {current.notes}</p>}
        <Button className="mt-5 w-full" disabled={!canRequest || busy === item.type || current?.status === "PENDING" || current?.status === "VERIFIED"} onClick={() => request(item.type)} variant={current ? "outline" : "default"}>
          {busy === item.type ? "Mengirim…" : current?.status === "REJECTED" || current?.status === "EXPIRED" ? "Ajukan Ulang" : current ? "Tidak ada tindakan" : "Kirim Verifikasi"}
        </Button>
      </Card>;
    })}</div>
    {!verifications.length && <EmptyState title="Belum ada permintaan verifikasi" description="Mulai dari Company, Domain, atau Business Email. Bukti lanjutan dapat dilengkapi saat tim TemuClient meminta informasi." />}
    <Card className="p-5"><div className="flex items-center gap-3"><FileCheck2 className="size-5 text-brand-600" /><div><h2 className="font-semibold">Business Documents & Advanced Verification</h2><p className="mt-1 text-sm text-text-secondary">Dokumen bisnis, budget, requirement, dan decision maker ditinjau sesuai konteks. Tidak ada satu badge tunggal yang mewakili semuanya.</p></div></div></Card>
  </div>;
}

function Status({ status }: { status?: string }) {
  if (status === "VERIFIED") return <Badge tone="success"><CheckCircle2 className="mr-1 size-3" />Verified</Badge>;
  if (status === "PENDING") return <Badge tone="warning"><Clock3 className="mr-1 size-3" />Pending</Badge>;
  if (status === "REJECTED") return <Badge tone="danger"><XCircle className="mr-1 size-3" />Rejected</Badge>;
  return <Badge tone="neutral">Optional</Badge>;
}
