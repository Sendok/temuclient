"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
import type { ProviderProfileData } from "@/modules/provider/service";

export type ProviderTaxonomies = {
  services: { id: string; name: string; slug: string }[];
  industries: { id: string; name: string; slug: string }[];
  technologies: { id: string; name: string; category: string | null }[];
};
type CapabilityProps = {
  profile: ProviderProfileData;
  taxonomies: ProviderTaxonomies;
  canEdit: boolean;
};

async function mutate(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(
      payload.error?.message ?? "Perubahan belum dapat disimpan.",
    );
  return payload.data;
}

export function ProviderCompanyProfile(props: CapabilityProps) {
  const { profile } = props;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Provider Profile"
        title={profile.organization.name}
        description="Kapabilitas ini menjadi sumber data untuk matching TemuClient di fase berikutnya."
        action={
          <Badge
            tone={
              profile.profileStrength.percentage === 100 ? "success" : "warning"
            }
          >
            {profile.profileStrength.percentage}% lengkap
          </Badge>
        }
      />
      <Strength profile={profile} />
      <nav
        aria-label="Bagian profil"
        className="flex gap-2 overflow-x-auto border-b pb-3 text-sm"
      >
        {[
          "Company",
          "Services",
          "Industries",
          "Portfolio",
          "Team",
          "Verification",
          "Availability",
        ].map((item) => (
          <a
            className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-text-secondary hover:bg-surface-subtle"
            href={`#${item.toLowerCase()}`}
            key={item}
          >
            {item}
          </a>
        ))}
      </nav>
      <CompanySummary profile={profile} />
      <ServiceSection {...props} />
      <IndustrySection {...props} />
      <PortfolioSection {...props} />
      <TeamSection {...props} />
      <VerificationSection profile={profile} />
    </div>
  );
}

export function ProviderDashboard({
  profile,
}: {
  profile: ProviderProfileData;
}) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Provider workspace"
        title={`Halo, ${profile.organization.name}`}
        description="Kapabilitas perusahaan Anda digunakan sebagai input matching yang deterministik."
        action={
          <Link
            className="rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
            href="/app/company"
          >
            Lengkapi Profile
          </Link>
        }
      />
      <Strength profile={profile} />
      <div className="grid gap-4 md:grid-cols-3">
        <Summary
          label="Services"
          value={String(profile.services.length)}
          detail={
            profile.services[0]?.serviceCategory.name ?? "Belum ada layanan"
          }
        />
        <Summary
          label="Industries"
          value={String(profile.industries.length)}
          detail={profile.industries[0]?.name ?? "Belum ada industri"}
        />
        <Summary
          label="Portfolio"
          value={String(profile.portfolios.length)}
          detail={profile.portfolios[0]?.title ?? "Belum ada portfolio"}
        />
      </div>
      <EmptyState
        title="Opportunity terverifikasi siap ditinjau"
        description="Buka feed untuk melihat Match Score, lalu kirim Introduction yang relevan kepada Buyer."
        action={<Link className="font-semibold text-brand-700" href="/app/opportunities">Buka Opportunity Feed →</Link>}
      />
    </div>
  );
}

const steps = [
  "company",
  "services",
  "project-range",
  "industries",
  "portfolio",
  "team",
  "verification",
  "complete",
] as const;
const stepLabels = [
  "Company",
  "Services",
  "Project Range",
  "Industries",
  "Portfolio",
  "Team",
  "Verification",
  "Complete",
];
export function ProviderOnboardingWizard({
  step,
  ...props
}: CapabilityProps & { step: string }) {
  const current = Math.max(1, steps.indexOf(step as (typeof steps)[number]));
  const previous =
    current > 1
      ? `/onboarding/provider/${steps[current - 1]}`
      : "/app/settings/company";
  const next =
    current < steps.length - 1
      ? `/onboarding/provider/${steps[current + 1]}`
      : "/app";
  const canContinue =
    step === "services"
      ? props.profile.services.length > 0
      : step === "project-range"
        ? props.profile.services.some(
            (item) => item.minProjectValue && item.maxProjectValue,
          )
        : step === "industries"
          ? props.profile.industries.length > 0
          : step === "team"
            ? props.profile.organization.teamCapacity !== null &&
              props.profile.organization.availability !== null
            : true;
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-surface px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link className="font-semibold" href="/app">
            TemuClient
          </Link>
          <span className="text-xs text-text-muted">Provider onboarding</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="mb-3 flex justify-between text-xs text-text-muted">
            <span>
              Langkah {current + 1} dari {steps.length}
            </span>
            <span>{Math.round(((current + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-brand-600"
              style={{ width: `${((current + 1) / steps.length) * 100}%` }}
            />
          </div>
          <ol className="mt-4 hidden grid-cols-8 gap-2 text-[11px] md:grid">
            {stepLabels.map((label, index) => (
              <li
                className={
                  index <= current
                    ? "font-semibold text-brand-700"
                    : "text-text-muted"
                }
                key={label}
              >
                {index < current && <Check className="mr-1 inline size-3" />}
                {label}
              </li>
            ))}
          </ol>
        </div>
        <Card className="p-5 sm:p-8">
          {step === "services" ? (
            <ServiceSection {...props} compact />
          ) : step === "project-range" ? (
            <ProjectRangeSection {...props} />
          ) : step === "industries" ? (
            <IndustrySection {...props} />
          ) : step === "portfolio" ? (
            <PortfolioSection {...props} />
          ) : step === "team" ? (
            <TeamSection {...props} />
          ) : step === "verification" ? (
            <VerificationSection profile={props.profile} />
          ) : (
            <Complete profile={props.profile} />
          )}
        </Card>
        <div className="mt-6 flex justify-between">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-surface px-4 text-sm font-medium"
            href={previous}
          >
            <ChevronLeft className="size-4" />
            Kembali
          </Link>
          {step !== "complete" &&
            (canContinue ? (
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-medium text-white"
                href={next}
              >
                Lanjutkan
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <Button disabled>Lengkapi langkah ini</Button>
            ))}
        </div>
        <p className="mt-4 text-center text-xs text-text-muted">
          Setiap aksi tambah atau simpan langsung dipersistensikan ke workspace
          Anda.
        </p>
      </div>
    </main>
  );
}

function Strength({ profile }: { profile: ProviderProfileData }) {
  const strength = profile.profileStrength;
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold">Profile Strength</p>
          <p className="mt-1 text-sm text-text-secondary">
            {strength.nextRecommendedAction ??
              "Profil capability sudah lengkap."}
          </p>
        </div>
        <span className="text-2xl font-semibold tabular-nums">
          {strength.percentage}%
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full bg-brand-600"
          style={{ width: `${strength.percentage}%` }}
        />
      </div>
      {strength.missingItems.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {strength.missingItems.slice(0, 3).map((item) => (
            <Badge key={item} tone="warning">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
function CompanySummary({ profile }: { profile: ProviderProfileData }) {
  const org = profile.organization;
  return (
    <section id="company">
      <SectionTitle title="Company" description="Informasi dasar perusahaan." />
      <Card className="mt-4 grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Detail
          label="Lokasi"
          value={[org.city, org.province].filter(Boolean).join(", ")}
        />
        <Detail label="Website" value={org.website} />
        <Detail
          label="Company size"
          value={org.companySize ? `${org.companySize} orang` : null}
        />
        <Detail label="Business email" value={org.businessEmail} />
      </Card>
    </section>
  );
}

type ServiceForm = {
  serviceCategoryId: string;
  description: string;
  minProjectValue: string;
  maxProjectValue: string;
  typicalDurationMin: string;
  typicalDurationMax: string;
  isPrimary: boolean;
};
function ServiceSection({
  profile,
  taxonomies,
  canEdit,
  compact = false,
}: CapabilityProps & { compact?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<ServiceForm>({
    defaultValues: {
      serviceCategoryId: "",
      description: "",
      minProjectValue: "",
      maxProjectValue: "",
      typicalDurationMin: "",
      typicalDurationMax: "",
      isPrimary: profile.services.length === 0,
    },
  });
  async function submit(values: ServiceForm) {
    try {
      setError("");
      await mutate("/api/v1/provider/services", "POST", values);
      form.reset();
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menyimpan layanan.",
      );
    }
  }
  async function remove(id: string) {
    try {
      await mutate(`/api/v1/provider/services/${id}`, "DELETE");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menghapus layanan.",
      );
    }
  }
  return (
    <section id="services">
      <SectionTitle
        title="Services"
        description="Definisikan layanan, nilai proyek, dan durasi tipikal."
      />
      {profile.services.length ? (
        <div className="mt-4 space-y-3">
          {profile.services.map((service) => (
            <Card
              className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
              key={service.id}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{service.serviceCategory.name}</p>
                  {service.isPrimary && <Badge tone="brand">Primary</Badge>}
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  {money(service.minProjectValue)}–
                  {money(service.maxProjectValue)} ·{" "}
                  {service.typicalDurationMin ?? "?"}–
                  {service.typicalDurationMax ?? "?"} bulan
                </p>
              </div>
              {canEdit && (
                <button
                  aria-label={`Hapus ${service.serviceCategory.name}`}
                  className="self-end p-2 text-danger-700 sm:self-auto"
                  onClick={() => remove(service.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Belum ada layanan"
            description="Tambahkan minimal satu layanan agar capability Provider dapat digunakan untuk matching."
          />
        </div>
      )}
      {canEdit && (
        <form
          className="mt-5 grid gap-4 rounded-lg border bg-surface-subtle p-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(submit)}
        >
          <Field label="Kategori layanan">
            <select
              className="min-h-11 w-full rounded-md border bg-surface px-3 text-sm"
              {...form.register("serviceCategoryId", { required: true })}
            >
              <option value="">Pilih layanan</option>
              {taxonomies.services
                .filter(
                  (item) =>
                    !profile.services.some(
                      (service) => service.serviceCategoryId === item.id,
                    ),
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Deskripsi (opsional)">
            <Input {...form.register("description")} />
          </Field>
          <Field label="Nilai proyek minimum (IDR, opsional)">
            <Input inputMode="numeric" {...form.register("minProjectValue")} />
          </Field>
          <Field label="Nilai proyek maksimum (IDR, opsional)">
            <Input inputMode="numeric" {...form.register("maxProjectValue")} />
          </Field>
          <Field label="Durasi minimum bulan (opsional)">
            <Input
              inputMode="numeric"
              {...form.register("typicalDurationMin")}
            />
          </Field>
          <Field label="Durasi maksimum bulan (opsional)">
            <Input
              inputMode="numeric"
              {...form.register("typicalDurationMax")}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("isPrimary")} />
            Jadikan layanan utama
          </label>
          <div className="sm:text-right">
            <Button type="submit">Tambah layanan</Button>
          </div>
          {error && (
            <p className="text-sm text-danger-700 sm:col-span-2" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      {!canEdit && !compact && <ReadOnly />}
    </section>
  );
}

function ProjectRangeSection({ profile, canEdit }: CapabilityProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await mutate(`/api/v1/provider/services/${id}`, "PATCH", data);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menyimpan rentang.",
      );
    }
  }
  return (
    <section>
      <SectionTitle
        title="Project Range"
        description="Nilai IDR dan durasi membantu memastikan future matching sesuai kapasitas komersial."
      />
      {profile.services.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Tambahkan layanan terlebih dahulu"
            description="Project range melekat pada setiap layanan Provider."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {profile.services.map((item) => (
            <form
              className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
              key={item.id}
              onSubmit={(event) => save(event, item.id)}
            >
              <p className="font-medium sm:col-span-2">
                {item.serviceCategory.name}
              </p>
              <Field label="Minimum IDR">
                <Input
                  defaultValue={item.minProjectValue ?? ""}
                  disabled={!canEdit}
                  name="minProjectValue"
                />
              </Field>
              <Field label="Maximum IDR">
                <Input
                  defaultValue={item.maxProjectValue ?? ""}
                  disabled={!canEdit}
                  name="maxProjectValue"
                />
              </Field>
              <Field label="Durasi minimum (bulan)">
                <Input
                  defaultValue={item.typicalDurationMin ?? ""}
                  disabled={!canEdit}
                  name="typicalDurationMin"
                />
              </Field>
              <Field label="Durasi maksimum (bulan)">
                <Input
                  defaultValue={item.typicalDurationMax ?? ""}
                  disabled={!canEdit}
                  name="typicalDurationMax"
                />
              </Field>
              {canEdit && (
                <div className="sm:col-span-2">
                  <Button type="submit">Simpan rentang</Button>
                </div>
              )}
            </form>
          ))}
          {error && <p className="text-sm text-danger-700">{error}</p>}
        </div>
      )}
    </section>
  );
}

function IndustrySection({ profile, taxonomies, canEdit }: CapabilityProps) {
  const router = useRouter();
  const [selected, setSelected] = useState(
    () => new Set(profile.industries.map((item) => item.industryId)),
  );
  const [status, setStatus] = useState("");
  async function save() {
    try {
      setStatus("Menyimpan…");
      await mutate("/api/v1/provider/profile", "PATCH", {
        industrySelections: [...selected].map((industryId) => ({
          industryId,
          experienceLevel:
            profile.industries.find((item) => item.industryId === industryId)
              ?.experienceLevel ?? "ADVANCED",
        })),
      });
      setStatus("Industri tersimpan.");
      router.refresh();
    } catch (cause) {
      setStatus(
        cause instanceof Error ? cause.message : "Gagal menyimpan industri.",
      );
    }
  }
  return (
    <section id="industries">
      <SectionTitle
        title="Industries"
        description="Pilih industri yang benar-benar memiliki pengalaman relevan."
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {taxonomies.industries.map((item) => (
          <label
            className="flex min-h-11 items-center gap-3 rounded-md border bg-surface px-3 text-sm"
            key={item.id}
          >
            <input
              checked={selected.has(item.id)}
              disabled={!canEdit}
              onChange={(event) =>
                setSelected((current) => {
                  const next = new Set(current);
                  if (event.target.checked) next.add(item.id);
                  else next.delete(item.id);
                  return next;
                })
              }
              type="checkbox"
            />
            {item.name}
          </label>
        ))}
      </div>
      {canEdit && (
        <div className="mt-4 flex items-center gap-4">
          <Button onClick={save}>Simpan industri</Button>
          <span className="text-xs text-text-muted" role="status">
            {status}
          </span>
        </div>
      )}
      {!canEdit && <ReadOnly />}
    </section>
  );
}

type PortfolioForm = {
  title: string;
  clientName: string;
  isClientConfidential: boolean;
  industryId: string;
  problem: string;
  solution: string;
  outcome: string;
  projectValueMin: string;
  projectValueMax: string;
  durationMonths: string;
  startedAt: string;
  completedAt: string;
  technologyIds: string[];
};
function PortfolioSection({ profile, taxonomies, canEdit }: CapabilityProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<PortfolioForm>({
    defaultValues: {
      title: "",
      clientName: "",
      isClientConfidential: false,
      industryId: "",
      problem: "",
      solution: "",
      outcome: "",
      projectValueMin: "",
      projectValueMax: "",
      durationMonths: "",
      startedAt: "",
      completedAt: "",
      technologyIds: [],
    },
  });
  async function submit(values: PortfolioForm) {
    try {
      setError("");
      await mutate("/api/v1/portfolio", "POST", values);
      form.reset();
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menyimpan portfolio.",
      );
    }
  }
  async function remove(id: string) {
    try {
      await mutate(`/api/v1/portfolio/${id}`, "DELETE");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menghapus portfolio.",
      );
    }
  }
  return (
    <section id="portfolio">
      <SectionTitle
        title="Portfolio"
        description="Bukti pengalaman dengan tampilan client yang aman untuk NDA."
      />
      {profile.portfolios.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {profile.portfolios.map((item) => (
            <Card className="p-5" key={item.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {item.clientDisplayName}
                  </p>
                </div>
                {canEdit && (
                  <button
                    aria-label={`Hapus ${item.title}`}
                    className="text-danger-700"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-text-secondary">
                {item.outcome ?? item.solution}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.technologies.map((tech) => (
                  <Badge key={tech.id}>{tech.name}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Belum ada portfolio"
            description="Portfolio bersifat opsional, tetapi memberi kontribusi terbesar pada Profile Strength."
          />
        </div>
      )}
      {canEdit && (
        <form
          className="mt-5 grid gap-4 rounded-lg border bg-surface-subtle p-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(submit)}
        >
          <Field label="Project Name">
            <Input {...form.register("title", { required: true })} />
          </Field>
          <Field label="Client Display Name (opsional bila confidential)">
            <Input {...form.register("clientName")} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" {...form.register("isClientConfidential")} />
            Client confidential — tampilkan nama NDA-safe
          </label>
          <Field label="Industry (opsional)">
            <select
              className="min-h-11 w-full rounded-md border bg-surface px-3 text-sm"
              {...form.register("industryId")}
            >
              <option value="">Pilih industri</option>
              {taxonomies.industries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration months (opsional)">
            <Input {...form.register("durationMonths")} />
          </Field>
          <TextArea
            label="Problem"
            registration={form.register("problem", { required: true })}
          />
          <TextArea
            label="Solution"
            registration={form.register("solution", { required: true })}
          />
          <TextArea
            label="Outcome (opsional)"
            registration={form.register("outcome")}
          />
          <Field label="Technology (opsional, multi-select)">
            <select
              className="min-h-28 w-full rounded-md border bg-surface px-3 py-2 text-sm"
              multiple
              {...form.register("technologyIds")}
            >
              {taxonomies.technologies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Project value minimum (opsional)">
            <Input {...form.register("projectValueMin")} />
          </Field>
          <Field label="Project value maximum (opsional)">
            <Input {...form.register("projectValueMax")} />
          </Field>
          <Field label="Started At (opsional)">
            <Input type="date" {...form.register("startedAt")} />
          </Field>
          <Field label="Completed At (opsional)">
            <Input type="date" {...form.register("completedAt")} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Tambah portfolio</Button>
          </div>
          {error && (
            <p className="text-sm text-danger-700 sm:col-span-2">{error}</p>
          )}
        </form>
      )}
      {!canEdit && <ReadOnly />}
    </section>
  );
}

function TeamSection({ profile, canEdit }: CapabilityProps) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const form = useForm<{
    companySize: string;
    teamCapacity: string;
    availability: string;
  }>({
    defaultValues: {
      companySize: String(profile.organization.companySize ?? ""),
      teamCapacity: String(profile.organization.teamCapacity ?? ""),
      availability: profile.organization.availability ?? "AVAILABLE",
    },
  });
  async function submit(values: {
    companySize: string;
    teamCapacity: string;
    availability: string;
  }) {
    try {
      await mutate("/api/v1/provider/profile", "PATCH", values);
      setStatus("Kapasitas tersimpan.");
      router.refresh();
    } catch (cause) {
      setStatus(
        cause instanceof Error ? cause.message : "Gagal menyimpan kapasitas.",
      );
    }
  }
  return (
    <section id="team">
      <SectionTitle
        title="Team / Capacity"
        description="Kapasitas aktif membantu matching menghindari proyek yang tidak realistis."
      />
      <form
        className="mt-4 grid gap-4 sm:grid-cols-3"
        onSubmit={form.handleSubmit(submit)}
      >
        <Field label="Jumlah anggota perusahaan">
          <Input disabled={!canEdit} {...form.register("companySize")} />
        </Field>
        <Field label="Kapasitas proyek aktif">
          <Input disabled={!canEdit} {...form.register("teamCapacity")} />
        </Field>
        <Field label="Availability">
          <select
            className="min-h-11 w-full rounded-md border bg-surface px-3 text-sm"
            disabled={!canEdit}
            {...form.register("availability")}
          >
            <option value="AVAILABLE">Available</option>
            <option value="LIMITED">Limited</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </Field>
        {canEdit && (
          <div className="sm:col-span-3">
            <Button type="submit">Simpan kapasitas</Button>
          </div>
        )}
        <span className="text-xs text-text-muted sm:col-span-3">{status}</span>
      </form>
      {!canEdit && <ReadOnly />}
    </section>
  );
}
function VerificationSection({ profile }: { profile: ProviderProfileData }) {
  const items = [
    ["Company profile", profile.verificationSummary.companyProfile],
    ["Business email", profile.verificationSummary.businessEmail],
    ["Account email", profile.verificationSummary.accountEmail],
  ] as const;
  return (
    <section id="verification">
      <SectionTitle
        title="Verification Summary"
        description="Kelengkapan profil membantu pengajuan; keputusan trust per tipe tersedia di Verification Center."
      />
      <Card className="mt-4 divide-y">
        {items.map(([label, complete]) => (
          <div className="flex items-center justify-between p-4" key={label}>
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-text-muted" />
              {label}
            </span>
            <Badge tone={complete ? "success" : "warning"}>
              {complete ? "Complete" : "Pending"}
            </Badge>
          </div>
        ))}
      </Card>
      <Link className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700" href="/app/company/verification">Buka Verification Center →</Link>
    </section>
  );
}
function Complete({ profile }: { profile: ProviderProfileData }) {
  return (
    <div className="py-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-50 text-success-700">
        <Check className="size-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold">Provider Profile siap</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
        Profile Strength Anda {profile.profileStrength.percentage}%. Anda tetap
        dapat melengkapi item yang belum ada dari Company Profile.
      </p>
      <Link
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-brand-600 px-5 text-sm font-semibold text-white"
        href="/app"
      >
        Buka Provider Dashboard
      </Link>
    </div>
  );
}

function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 truncate text-xs text-text-secondary">{detail}</p>
    </Card>
  );
}
function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
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
    <label>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-md border bg-surface p-3 text-sm"
        {...registration}
      />
    </label>
  );
}
function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-2 text-sm">{value || "Belum diisi"}</dd>
    </div>
  );
}
function ReadOnly() {
  return (
    <p className="mt-4 rounded-md border bg-surface-subtle p-3 text-xs text-text-secondary">
      Mode read-only. Hanya Owner atau Admin yang dapat mengubah capability
      Provider.
    </p>
  );
}
function money(value: string | null) {
  if (!value) return "Belum diisi";
  return `Rp${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value))}`;
}
