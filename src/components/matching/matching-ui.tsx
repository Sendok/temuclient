"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui/primitives";
import type {
  BuyerMatchData,
  ProviderFeedData,
  ProviderOpportunityData,
} from "@/modules/matching/service";
import { RequestIntroductionPanel } from "@/components/introduction/introduction-ui";
import type { IntroductionListData } from "@/modules/introductions/service";

const money = (value: string | null, currency = "IDR") =>
  value
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(Number(value))
    : "Tidak diungkapkan";

export function ProviderOpportunityFeed({
  feed,
  query,
}: {
  feed: ProviderFeedData;
  query: Record<string, string | undefined>;
}) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Verified opportunities"
        title="Opportunity feed"
        description="Peluang yang sesuai dengan layanan dan rentang proyek perusahaan Anda, diperingkat secara deterministik."
      />
      <p className="rounded-md border bg-surface-subtle px-4 py-3 text-sm text-text-secondary">Paket {feed.access.plan}: {feed.access.opportunityAccessPerMonth === null ? "akses opportunity tanpa batas" : `${feed.access.opportunityAccessPerMonth} opportunity per bulan`}. {!feed.access.matchIntelligence && "Breakdown Match Intelligence tersedia mulai paket Pro."}</p>
      <form
        className="grid gap-3 rounded-lg border bg-surface p-4 sm:grid-cols-5"
        method="get"
      >
        <Input defaultValue={query.q} name="q" placeholder="Cari kebutuhan" />
        <Input defaultValue={query.city} name="city" placeholder="Kota" />
        <Input
          defaultValue={query.matchMin}
          min="0"
          max="100"
          name="matchMin"
          placeholder="Skor minimum"
          type="number"
        />
        <select
          className="rounded-md border bg-surface px-3 text-sm"
          defaultValue={query.sort ?? "match"}
          name="sort"
        >
          <option value="match">Match terbaik</option>
          <option value="intent">Intent tertinggi</option>
          <option value="recent">Terbaru</option>
        </select>
        <Button type="submit">Terapkan filter</Button>
      </form>
      {!feed.items.length ? (
        <EmptyState
          title="Belum ada opportunity yang cocok"
          description="Lengkapi layanan, rentang proyek, industri, dan availability pada profil perusahaan Anda."
        />
      ) : (
        <div className="grid gap-4">
          {feed.items.map((item) => (
            <OpportunityCard item={item} key={item.matchId} />
          ))}
        </div>
      )}
      {feed.nextCursor && (
        <div className="flex justify-center">
          <Link
            className="rounded-md border px-4 py-2 text-sm font-semibold"
            href={{
              pathname: "/app/opportunities",
              query: { ...query, cursor: feed.nextCursor },
            }}
          >
            Muat berikutnya
          </Link>
        </div>
      )}
    </div>
  );
}

function OpportunityCard({
  item,
}: {
  item: ProviderFeedData["items"][number];
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-5 sm:flex-row">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{item.totalScore}% match</Badge>
            <Badge tone={item.intentScore >= 75 ? "warning" : "neutral"}>
              {item.intentLevel.replaceAll("_", " ")} intent
            </Badge>
            {item.saved && <Badge tone="neutral">Tersimpan</Badge>}
          </div>
          <Link
            className="mt-3 block text-lg font-semibold hover:text-brand-700"
            href={`/app/opportunities/${item.id}`}
          >
            {item.title}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
            {item.problemStatement}
          </p>
          <p className="mt-3 text-xs text-text-muted">
            {item.serviceCategory?.name} · {item.industry?.name} ·{" "}
            {item.city ?? "Lokasi fleksibel"}
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-sm font-semibold">
            {money(item.budgetMin)}–{money(item.budgetMax)}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            Berakhir{" "}
            {item.expiresAt
              ? new Date(item.expiresAt).toLocaleDateString("id-ID")
              : "belum ditentukan"}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function ProviderOpportunityDetail({
  opportunity,
  portfolios,
  existingIntroduction,
  canRequest,
}: {
  opportunity: ProviderOpportunityData;
  portfolios: { id: string; title: string; status: string }[];
  existingIntroduction?: IntroductionListData[number];
  canRequest: boolean;
}) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`${opportunity.totalScore}% match`}
        title={opportunity.title}
        description="Informasi buyer yang bersifat pribadi tetap terlindungi sampai Introduction diterima."
        action={
          <div className="flex flex-wrap gap-2">
            {opportunity.matchIntelligenceAvailable && <Link href={`/app/ai-sales?task=opportunity-analysis&entity=${opportunity.id}`}>
              <Button variant="outline">Analyze with AI</Button>
            </Link>}
            <SaveButton id={opportunity.id} initial={opportunity.saved} />
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="font-semibold">Masalah bisnis</h2>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              {opportunity.problemStatement}
            </p>
            {opportunity.businessObjective && (
              <>
                <h2 className="mt-6 font-semibold">Tujuan</h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {opportunity.businessObjective}
                </p>
              </>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Requirement</h2>
            <div className="mt-4 space-y-4">
              {opportunity.requirements.map((item) => (
                <div className="border-l-2 border-brand-200 pl-4" key={item.id}>
                  <p className="text-sm font-medium">
                    {item.label}{" "}
                    <span className="text-xs text-text-muted">
                      · {item.priority.replaceAll("_", " ")}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="font-semibold">Why this matches</h2>
            {!opportunity.matchIntelligenceAvailable ? <p className="mt-3 text-sm leading-6 text-text-secondary">Breakdown faktor dan alasan kecocokan tersedia pada paket Pro dan Business.</p> : <div className="mt-4 space-y-3">
              {opportunity.reasons!
                .filter((item) => item.score > 0)
                .map((item) => (
                  <div key={item.factor}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize">{item.factor}</span>
                      <span>
                        {item.score}/{item.maximum}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">
                      {item.message}
                    </p>
                  </div>
                ))}
            </div>}
          </Card>
          <Card className="p-5 text-sm">
            <p className="font-semibold">Project facts</p>
            <dl className="mt-4 space-y-3 text-text-secondary">
              <Fact
                label="Budget"
                value={`${money(opportunity.budgetMin)}–${money(opportunity.budgetMax)}`}
              />
              <Fact label="Lokasi" value={opportunity.city ?? "Fleksibel"} />
              <Fact label="Intent" value={`${opportunity.intentScore}/100`} />
              <Fact
                label="Verifikasi"
                value={`${opportunity.verificationLevel}`}
              />
            </dl>
          </Card>
          <RequestIntroductionPanel
            canRequest={canRequest}
            existing={existingIntroduction}
            opportunityId={opportunity.id}
            opportunityTitle={opportunity.title}
            portfolios={portfolios}
          />
        </aside>
      </div>
    </div>
  );
}

function SaveButton({ id, initial }: { id: string; initial: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const response = await fetch(`/api/v1/opportunities/${id}/save`, {
      method: saved ? "DELETE" : "POST",
    });
    if (response.ok) {
      setSaved(!saved);
      router.refresh();
    }
    setBusy(false);
  }
  return (
    <Button disabled={busy} onClick={toggle} variant="outline">
      {saved ? "Hapus simpan" : "Simpan"}
    </Button>
  );
}

export function BuyerMatches({
  opportunityId,
  matches,
}: {
  opportunityId: string;
  matches: BuyerMatchData[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Ranked providers"
        title="Provider matches"
        description="Skor konsisten berdasarkan layanan, pengalaman, budget, portfolio, teknologi, kapasitas, lokasi, dan availability."
        action={
          selected.length ? (
            <Link
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
              href={`/app/requirements/${opportunityId}/compare?providers=${selected.join(",")}`}
            >
              Bandingkan {selected.length}
            </Link>
          ) : undefined
        }
      />
      {!matches.length ? (
        <EmptyState
          title="Match sedang diproses"
          description="Provider yang memenuhi layanan dan rentang proyek akan muncul di sini."
        />
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <Card className="p-5" key={match.matchId}>
              <div className="flex items-start gap-4">
                <input
                  aria-label={`Pilih ${match.provider.name}`}
                  checked={selected.includes(match.provider.id)}
                  className="mt-1"
                  disabled={
                    !selected.includes(match.provider.id) &&
                    selected.length >= 3
                  }
                  onChange={() => toggle(match.provider.id)}
                  type="checkbox"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">#{index + 1}</Badge>
                    <Badge tone="success">{match.totalScore}% match</Badge>
                  </div>
                  <Link
                    className="mt-3 block text-lg font-semibold hover:text-brand-700"
                    href={`/app/providers/${match.provider.id}?opportunity=${opportunityId}`}
                  >
                    {match.provider.name}
                  </Link>
                  <p className="mt-2 text-sm text-text-secondary">
                    {match.provider.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {match.provider.services.slice(0, 4).map((service) => (
                      <Badge key={service.id} tone="neutral">
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuyerProviderDetail({ match }: { match: BuyerMatchData }) {
  const provider = match.provider;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`${match.totalScore}% match`}
        title={provider.name}
        description={provider.description ?? "Profil provider terverifikasi."}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="font-semibold">Kapabilitas</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {provider.services.map((service) => (
                <Badge key={service.id} tone="neutral">
                  {service.name}
                </Badge>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Portfolio</h2>
            <div className="mt-4 space-y-5">
              {provider.portfolios.map((portfolio) => (
                <div className="border-b pb-5 last:border-0" key={portfolio.id}>
                  <p className="font-medium">{portfolio.title}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {portfolio.clientDisplayName} · {portfolio.industryName}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    {portfolio.solution}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="h-fit p-5">
          <h2 className="font-semibold">Match breakdown</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(match.factors).map(([factor, score]) => (
              <Fact key={factor} label={factor} value={String(score)} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function BuyerCompare({ matches }: { matches: BuyerMatchData[] }) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Maximum 3 providers"
        title="Compare providers"
        description="Perbandingan sisi-ke-sisi menggunakan data match yang sama, tanpa mengubah ranking."
      />
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[720px] gap-4"
          style={{
            gridTemplateColumns: `160px repeat(${matches.length}, minmax(220px, 1fr))`,
          }}
        >
          <div />
          <>
            {matches.map((match) => (
              <Card className="p-5" key={match.matchId}>
                <p className="font-semibold">{match.provider.name}</p>
                <p className="mt-2 text-2xl font-semibold text-brand-700">
                  {match.totalScore}%
                </p>
              </Card>
            ))}
          </>
          {Object.keys(matches[0]?.factors ?? {}).map((factor) => (
            <ComparisonRow factor={factor} key={factor} matches={matches} />
          ))}
        </div>
      </div>
    </div>
  );
}
function ComparisonRow({
  factor,
  matches,
}: {
  factor: string;
  matches: BuyerMatchData[];
}) {
  return (
    <>
      <div className="self-center text-sm font-semibold capitalize">
        {factor}
      </div>
      {matches.map((match) => (
        <Card
          className="p-4 text-center text-sm"
          key={`${factor}-${match.matchId}`}
        >
          {match.factors[factor as keyof typeof match.factors]}
        </Card>
      ))}
    </>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="capitalize text-text-muted">{label}</dt>
      <dd className="text-right font-medium text-text-primary">{value}</dd>
    </div>
  );
}
