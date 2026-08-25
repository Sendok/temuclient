"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui/primitives";
import {
  requestIntroductionSchema,
  type RequestIntroductionInput,
} from "@/modules/introductions/schema";
import type {
  IntroductionData,
  IntroductionListData,
} from "@/modules/introductions/service";

type PortfolioOption = { id: string; title: string; status: string };

export function RequestIntroductionPanel({
  opportunityId,
  opportunityTitle,
  portfolios,
  existing,
  canRequest,
}: {
  opportunityId: string;
  opportunityTitle: string;
  portfolios: PortfolioOption[];
  existing?: IntroductionListData[number];
  canRequest: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<RequestIntroductionInput>({
    resolver: zodResolver(requestIntroductionSchema),
    defaultValues: {
      portfolioIds: [],
      fitSummary: "",
      proposedApproach: "",
      estimatedTimeline: "",
      message: "",
    },
  });
  async function submit(input: RequestIntroductionInput) {
    setError("");
    const response = await fetch(
      `/api/v1/opportunities/${opportunityId}/introductions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error?.message ?? "Permintaan belum dapat dikirim.");
      return;
    }
    router.push(`/app/introductions/${payload.data.id}`);
    router.refresh();
  }
  if (existing)
    return (
      <div className="space-y-2">
        <Link
          className="flex min-h-11 w-full items-center justify-center rounded-md border bg-surface px-4 text-sm font-semibold text-brand-700"
          href={`/app/introductions/${existing.id}`}
        >
          Introduction {labelStatus(existing.status)}
        </Link>
        <p className="text-center text-xs text-text-muted">
          Permintaan aktif tidak dapat diduplikasi.
        </p>
      </div>
    );
  if (!canRequest)
    return (
      <p className="rounded-md border bg-surface-subtle p-3 text-xs text-text-secondary">
        Role Member dapat melihat opportunity, tetapi hanya Sales, Admin, atau
        Owner yang dapat meminta Introduction.
      </p>
    );
  if (!portfolios.length)
    return (
      <Link
        className="flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold text-brand-700"
        href="/app/company"
      >
        Tambahkan portfolio terpublikasi
      </Link>
    );
  return (
    <>
      {!open ? (
        <Button className="w-full" onClick={() => setOpen(true)}>
          Request Introduction
        </Button>
      ) : (
        <div
          className="fixed inset-0 z-[70] bg-text-primary/30"
          onClick={() => setOpen(false)}
        >
          <aside
            aria-modal="true"
            className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l bg-surface p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Request Introduction
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {opportunityTitle}
                </h2>
              </div>
              <button
                aria-label="Tutup"
                className="min-h-11 px-3 text-sm"
                onClick={() => setOpen(false)}
              >
                Tutup
              </button>
            </div>
            <form
              className="mt-7 space-y-5"
              onSubmit={form.handleSubmit(submit)}
            >
              <fieldset>
                <legend className="text-sm font-medium">
                  Relevant Portfolio
                </legend>
                <div className="mt-2 space-y-2 rounded-md border p-3">
                  {portfolios
                    .filter((item) => item.status === "PUBLISHED")
                    .map((portfolio) => (
                      <label
                        className="flex min-h-10 items-center gap-3 text-sm"
                        key={portfolio.id}
                      >
                        <input
                          type="checkbox"
                          value={portfolio.id}
                          {...form.register("portfolioIds")}
                        />
                        {portfolio.title}
                      </label>
                    ))}
                </div>
                <FieldError
                  message={form.formState.errors.portfolioIds?.message}
                />
              </fieldset>
              <TextArea
                label="Why Your Company Fits"
                registration={form.register("fitSummary")}
              />
              <FieldError message={form.formState.errors.fitSummary?.message} />
              <TextArea
                label="Proposed Approach"
                registration={form.register("proposedApproach")}
              />
              <FieldError
                message={form.formState.errors.proposedApproach?.message}
              />
              <label className="block text-sm font-medium">
                Estimated Timeline
                <Input
                  className="mt-2"
                  placeholder="Contoh: 4–6 bulan"
                  {...form.register("estimatedTimeline")}
                />
              </label>
              <FieldError
                message={form.formState.errors.estimatedTimeline?.message}
              />
              <label className="block text-sm font-medium">
                Short Message{" "}
                <span className="text-text-muted">(opsional)</span>
                <Input
                  className="mt-2"
                  placeholder="Pesan singkat untuk buyer"
                  {...form.register("message")}
                />
              </label>
              <p className="text-xs leading-5 text-text-muted">
                Semua isi akan dikirim hanya setelah Anda review dan menekan
                tombol kirim.
              </p>
              {error && (
                <p className="text-sm text-danger-700" role="alert">
                  {error}
                </p>
              )}
              <Button
                className="w-full"
                disabled={form.formState.isSubmitting}
                type="submit"
              >
                {form.formState.isSubmitting
                  ? "Mengirim…"
                  : "Kirim Permintaan Introduction"}
              </Button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

export function IntroductionInbox({
  introductions,
  activeStatus,
}: {
  introductions: IntroductionListData;
  activeStatus?: string;
}) {
  const tabs = [
    ["All", undefined],
    ["Pending", "REQUESTED"],
    ["Accepted", "ACCEPTED"],
    ["Declined", "DECLINED"],
  ] as const;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Introductions"
        description="Kelola permintaan koneksi yang berasal dari match terverifikasi."
      />
      <div className="flex overflow-x-auto border-b">
        {tabs.map(([label, status]) => (
          <Link
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${activeStatus === status || (!activeStatus && !status) ? "border-brand-600 text-brand-700" : "border-transparent text-text-secondary"}`}
            href={
              status
                ? `/app/introductions?status=${status}`
                : "/app/introductions"
            }
            key={label}
          >
            {label}
          </Link>
        ))}
      </div>
      {!introductions.length ? (
        <EmptyState
          title="Belum ada Introduction"
          description="Introduction akan muncul setelah Provider mengirim permintaan dari opportunity yang eligible."
        />
      ) : (
        <div className="space-y-3">
          {introductions.map((item) => (
            <Card
              className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
              key={item.id}
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(item.status)}>
                    {labelStatus(item.status)}
                  </Badge>
                  <Badge tone="neutral">
                    {item.match?.totalScore ?? 0}% match
                  </Badge>
                </div>
                <p className="mt-3 font-semibold">{item.opportunity.title}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {item.direction === "incoming"
                    ? item.provider.name
                    : item.safeBuyerDisplay}{" "}
                  ·{" "}
                  {new Date(item.createdAt).toLocaleDateString("id-ID", {
                    timeZone: "Asia/Jakarta",
                  })}
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-brand-700"
                href={`/app/introductions/${item.id}`}
              >
                {item.status === "ACCEPTED" ? "Lihat koneksi" : "Review detail"}{" "}
                →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function IntroductionDetail({
  introduction,
  canRespond,
  canCancel,
}: {
  introduction: IntroductionData;
  canRespond: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function action(name: "accept" | "decline" | "cancel") {
    setBusy(true);
    setError("");
    const response = await fetch(
      `/api/v1/introductions/${introduction.id}/${name}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body:
          name === "decline"
            ? JSON.stringify({ reason: reason || undefined })
            : undefined,
      },
    );
    const payload = await response.json();
    if (!response.ok)
      setError(payload.error?.message ?? "Status belum dapat diperbarui.");
    else {
      router.refresh();
    }
    setBusy(false);
  }
  const incoming = introduction.direction === "incoming";
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`Introduction · ${labelStatus(introduction.status)}`}
        title={introduction.opportunity.title}
        description={
          incoming
            ? `Permintaan dari ${introduction.provider.name}`
            : `Permintaan kepada ${introduction.safeBuyerDisplay}`
        }
        action={
          <Badge tone={statusTone(introduction.status)}>
            {introduction.status}
          </Badge>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="space-y-5 p-6">
            <Section title="Fit Summary" value={introduction.fitSummary} />
            <Section
              title="Proposed Approach"
              value={introduction.proposedApproach}
            />
            <Section
              title="Estimated Timeline"
              value={introduction.estimatedTimeline}
            />
            <Section title="Short Message" value={introduction.message} />
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Relevant Portfolio</h2>
            <div className="mt-4 space-y-5">
              {introduction.portfolios.map((portfolio) => (
                <div className="border-b pb-5 last:border-0" key={portfolio.id}>
                  <p className="font-medium">{portfolio.title}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {portfolio.clientDisplayName} · {portfolio.industryName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {portfolio.solution}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          {incoming && (
            <Card className="p-6">
              <h2 className="font-semibold">Provider</h2>
              <p className="mt-2 font-medium">{introduction.provider.name}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {introduction.provider.description}
              </p>
              <Link
                className="mt-4 inline-block text-sm font-semibold text-brand-700"
                href={`/app/providers/${introduction.provider.id}?opportunity=${introduction.opportunity.id}`}
              >
                Buka profil Provider →
              </Link>
            </Card>
          )}
          {introduction.connectionContext && (
            <Card className="border-success-100 bg-success-50 p-6">
              <h2 className="font-semibold text-success-700">
                Business connection unlocked
              </h2>
              <p className="mt-3 font-medium">
                {introduction.connectionContext.organization.name}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {introduction.connectionContext.organization.businessEmail ??
                  "Email bisnis belum tersedia"}{" "}
                ·{" "}
                {introduction.connectionContext.organization.phone ??
                  "Telepon belum tersedia"}
              </p>
              {introduction.connectionContext.contacts.map((contact) => (
                <p className="mt-2 text-sm" key={contact.id}>
                  {contact.name} · {contact.email}
                </p>
              ))}
              <p className="mt-4 text-xs text-text-muted">
                {introduction.connectionContext.conversationId ? (
                  <Link
                    className="font-semibold text-brand-700"
                    href={`/app/messages?conversation=${introduction.connectionContext.conversationId}`}
                  >
                    Buka conversation →
                  </Link>
                ) : (
                  "Conversation belum tersedia."
                )}
              </p>
            </Card>
          )}
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Match Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-700">
              {introduction.match?.totalScore ?? 0}%
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {Object.entries(introduction.match?.factors ?? {}).map(
                ([factor, score]) => (
                  <div className="flex justify-between" key={factor}>
                    <dt className="capitalize text-text-muted">{factor}</dt>
                    <dd className="font-medium">{score}</dd>
                  </div>
                ),
              )}
            </dl>
          </Card>
          {introduction.status === "REQUESTED" && incoming && canRespond && (
            <Card className="space-y-3 p-4">
              <label className="block text-sm font-medium">
                Alasan decline{" "}
                <span className="text-text-muted">(internal, opsional)</span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border bg-surface p-3 text-sm"
                  onChange={(event) => setReason(event.target.value)}
                  value={reason}
                />
              </label>
              <Button
                className="w-full"
                disabled={busy}
                onClick={() => action("accept")}
              >
                Accept Introduction
              </Button>
              <Button
                className="w-full"
                disabled={busy}
                onClick={() => action("decline")}
                variant="outline"
              >
                Decline
              </Button>
            </Card>
          )}
          {introduction.status === "REQUESTED" && !incoming && canCancel && (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => action("cancel")}
              variant="outline"
            >
              Cancel Request
            </Button>
          )}
          {error && (
            <p className="text-sm text-danger-700" role="alert">
              {error}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function TextArea({
  label,
  registration,
}: {
  label: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full rounded-md border bg-surface p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        {...registration}
      />
    </label>
  );
}
function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-danger-700">{message}</p>
  ) : null;
}
function Section({ title, value }: { title: string; value: string | null }) {
  return (
    <section>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
        {value || "Tidak diisi"}
      </p>
    </section>
  );
}
function labelStatus(status: string) {
  return status === "REQUESTED"
    ? "Pending"
    : status.charAt(0) + status.slice(1).toLowerCase();
}
function statusTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  return status === "ACCEPTED"
    ? "success"
    : status === "REQUESTED"
      ? "warning"
      : status === "DECLINED" || status === "CANCELLED" || status === "EXPIRED"
        ? "danger"
        : "neutral";
}
