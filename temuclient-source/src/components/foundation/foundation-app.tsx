"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FoundationShell } from "@/components/foundation/foundation-shell";
import {
  ProviderCompanyProfile,
  ProviderDashboard,
  type ProviderTaxonomies,
} from "@/components/company/provider-capability";
import {
  BuyerDashboard,
  NewRequirement,
  RequirementDetail,
  RequirementList,
  RequirementReview,
  type BuyerTaxonomies,
} from "@/components/opportunity/buyer-requirements";
import { Button } from "@/components/ui/button";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui/primitives";
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from "@/modules/organizations/schema";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/modules/users/schema";
import type { ProviderProfileData } from "@/modules/provider/service";
import type { BuyerOpportunityData } from "@/modules/opportunities/service";
import {
  BuyerCompare,
  BuyerMatches,
  BuyerProviderDetail,
  ProviderOpportunityDetail,
  ProviderOpportunityFeed,
} from "@/components/matching/matching-ui";
import type {
  BuyerMatchData,
  ProviderFeedData,
  ProviderOpportunityData,
} from "@/modules/matching/service";
import {
  IntroductionDetail,
  IntroductionInbox,
} from "@/components/introduction/introduction-ui";
import type {
  IntroductionData,
  IntroductionListData,
} from "@/modules/introductions/service";
import { MessagingWorkspace } from "@/components/messaging/messaging-ui";
import { MeetingWorkspace } from "@/components/messaging/meeting-ui";
import { NotificationCenter } from "@/components/messaging/notification-ui";
import type {
  ConversationData,
  ConversationListData,
  MessageListData,
} from "@/modules/conversations/service";
import type { MeetingData, MeetingListData } from "@/modules/meetings/service";
import type { NotificationListData } from "@/modules/notifications/service";
import {
  DealDetail,
  DealPipeline,
  ProposalEditor,
} from "@/components/deals/deal-ui";
import type { DealData, DealListData } from "@/modules/deals/service";
import type { ProposalData } from "@/modules/proposals/service";
import { AISalesWorkspace, MeetingPrepPage } from "@/components/ai/ai-sales";
import type { AISalesContext } from "@/modules/ai/sales-service";
import { VerificationCenter } from "@/components/company/verification-center";
import type { VerificationData } from "@/modules/verification/service";
import type { getOrganizationSubscription } from "@/modules/billing/service";
import { SubscriptionSettings } from "@/components/billing/subscription-settings";
import type { getOrganizationAnalytics } from "@/modules/analytics/service";

export type FoundationData = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerifiedAt: string | null;
  };
  organization: {
    id: string;
    name: string;
    type: "BUYER" | "PROVIDER" | "HYBRID";
    website: string | null;
    city: string | null;
    description: string | null;
    businessEmail: string | null;
    status: string;
  };
  membership: { role: "OWNER" | "ADMIN" | "SALES" | "MEMBER" };
  members: {
    id: string;
    role: string;
    status: string;
    user: { name: string; email: string };
  }[];
  providerProfile?: ProviderProfileData;
  providerTaxonomies?: ProviderTaxonomies;
  buyerOpportunities?: BuyerOpportunityData[];
  buyerOpportunity?: BuyerOpportunityData;
  buyerTaxonomies?: BuyerTaxonomies;
  providerFeed?: ProviderFeedData;
  providerFeedQuery?: Record<string, string | undefined>;
  providerOpportunity?: ProviderOpportunityData;
  buyerMatches?: BuyerMatchData[];
  buyerProvider?: BuyerMatchData;
  comparedProviders?: BuyerMatchData[];
  introductions?: IntroductionListData;
  introduction?: IntroductionData;
  introductionStatusFilter?: string;
  existingIntroduction?: IntroductionListData[number];
  conversations?: ConversationListData;
  conversation?: ConversationData;
  messages?: MessageListData;
  conversationExplicitlySelected?: boolean;
  meetings?: MeetingListData;
  meeting?: MeetingData;
  meetingView?: "upcoming" | "past";
  notifications?: NotificationListData;
  deals?: DealListData;
  deal?: DealData;
  dealView?: "board" | "list" | "closed";
  dealTab?: string;
  dealFilters?: Record<string, string | undefined>;
  proposal?: ProposalData;
  aiSalesContext?: AISalesContext;
  aiTask?: string;
  aiEntityId?: string;
  verifications?: VerificationData[];
  subscription?: Awaited<ReturnType<typeof getOrganizationSubscription>>;
  analytics?: Awaited<ReturnType<typeof getOrganizationAnalytics>>;
};

export function FoundationApp({
  data,
  slug,
  forbidden = false,
}: {
  data: FoundationData;
  slug: string[];
  forbidden?: boolean;
}) {
  const persona = data.organization.type === "BUYER" ? "buyer" : "provider";
  const route = slug.join("/");
  let content: React.ReactNode;
  if (forbidden) content = <Forbidden />;
  else if (!route && persona === "provider" && data.providerProfile)
    content = <ProviderDashboard profile={data.providerProfile} />;
  else if (!route && persona === "buyer" && data.buyerOpportunities)
    content = (
      <BuyerDashboard
        opportunities={data.buyerOpportunities}
        organizationName={data.organization.name}
      />
    );
  else if (!route)
    content = (
      <Dashboard persona={persona} organizationName={data.organization.name} />
    );
  else if (route === "company/verification" && data.verifications)
    content = <VerificationCenter organizationId={data.organization.id} canRequest={["OWNER", "ADMIN"].includes(data.membership.role)} verifications={data.verifications} />;
  else if (route === "requirements" && data.buyerOpportunities)
    content = <RequirementList opportunities={data.buyerOpportunities} />;
  else if (route === "requirements/new") content = <NewRequirement />;
  else if (
    slug[0] === "requirements" &&
    slug[2] === "matches" &&
    data.buyerMatches
  )
    content = (
      <BuyerMatches opportunityId={slug[1]} matches={data.buyerMatches} />
    );
  else if (
    slug[0] === "requirements" &&
    slug[2] === "compare" &&
    data.comparedProviders
  )
    content = <BuyerCompare matches={data.comparedProviders} />;
  else if (
    slug[0] === "requirements" &&
    slug[2] === "review" &&
    data.buyerOpportunity &&
    data.buyerTaxonomies
  )
    content = (
      <RequirementReview
        canEdit={["OWNER", "ADMIN"].includes(data.membership.role)}
        opportunity={data.buyerOpportunity}
        taxonomies={data.buyerTaxonomies}
      />
    );
  else if (slug[0] === "requirements" && slug[1] && data.buyerOpportunity)
    content = (
      <RequirementDetail
        canEdit={["OWNER", "ADMIN"].includes(data.membership.role)}
        opportunity={data.buyerOpportunity}
      />
    );
  else if (route === "opportunities" && data.providerFeed)
    content = (
      <ProviderOpportunityFeed
        feed={data.providerFeed}
        query={data.providerFeedQuery ?? {}}
      />
    );
  else if (slug[0] === "opportunities" && slug[1] && data.providerOpportunity)
    content = (
      <ProviderOpportunityDetail
        canRequest={["OWNER", "ADMIN", "SALES"].includes(data.membership.role)}
        existingIntroduction={data.existingIntroduction}
        opportunity={data.providerOpportunity}
        portfolios={data.providerProfile?.portfolios ?? []}
      />
    );
  else if (route === "introductions" && data.introductions)
    content = (
      <IntroductionInbox
        activeStatus={data.introductionStatusFilter}
        introductions={data.introductions}
      />
    );
  else if (slug[0] === "introductions" && slug[1] && data.introduction)
    content = (
      <IntroductionDetail
        canCancel={["OWNER", "ADMIN", "SALES"].includes(data.membership.role)}
        canRespond={["OWNER", "ADMIN"].includes(data.membership.role)}
        introduction={data.introduction}
      />
    );
  else if (route === "messages" && data.conversations)
    content = (
      <MessagingWorkspace
        conversation={data.conversation}
        conversations={data.conversations}
        currentUserId={data.user.id}
        explicitlySelected={Boolean(data.conversationExplicitlySelected)}
        messages={data.messages}
      />
    );
  else if (slug[0] === "meetings" && slug[1] && slug[2] === "prepare" && data.meeting)
    content = <MeetingPrepPage meeting={data.meeting} />;
  else if (slug[0] === "meetings" && data.meetings && data.conversations)
    content = (
      <MeetingWorkspace
        conversations={data.conversations}
        currentUserId={data.user.id}
        meeting={data.meeting}
        meetings={data.meetings}
        view={data.meetingView ?? "upcoming"}
      />
    );
  else if (route === "notifications" && data.notifications)
    content = <NotificationCenter notifications={data.notifications} />;
  else if (route === "deals" && data.deals)
    content = (
      <DealPipeline
        deals={data.deals}
        filters={data.dealFilters ?? {}}
        view={data.dealView ?? "board"}
      />
    );
  else if (slug[0] === "deals" && slug[1] && data.deal)
    content = (
      <DealDetail
        currentUserId={data.user.id}
        deal={data.deal}
        role={data.membership.role}
        tab={data.dealTab}
      />
    );
  else if (slug[0] === "proposals" && slug[1] && data.proposal)
    content = (
      <ProposalEditor
        canManage={
          ["OWNER", "ADMIN"].includes(data.membership.role) ||
          (data.membership.role === "SALES" &&
            data.proposal.deal.ownerUserId === data.user.id)
        }
        proposal={data.proposal}
      />
    );
  else if (route === "ai-sales" && data.aiSalesContext)
    content = (
      <AISalesWorkspace
        context={data.aiSalesContext}
        initialEntityId={data.aiEntityId}
        initialTask={data.aiTask}
      />
    );
  else if (slug[0] === "providers" && slug[1] && data.buyerProvider)
    content = <BuyerProviderDetail match={data.buyerProvider} />;
  else if (
    route === "company" &&
    persona === "provider" &&
    data.providerProfile &&
    data.providerTaxonomies
  )
    content = (
      <ProviderCompanyProfile
        canEdit={["OWNER", "ADMIN"].includes(data.membership.role)}
        profile={data.providerProfile}
        taxonomies={data.providerTaxonomies}
      />
    );
  else if (route === "company") content = <Company data={data} />;
  else if (route === "settings/profile") content = <Profile data={data} />;
  else if (route === "settings/company")
    content = <CompanySettings data={data} />;
  else if (route === "settings/members") content = <Members data={data} />;
  else if (route === "settings/security") content = <Security data={data} />;
  else if (route === "settings/billing" && data.subscription) content = <SubscriptionSettings subscription={data.subscription} canManage={["OWNER", "ADMIN"].includes(data.membership.role)} isBuyer={data.organization.type === "BUYER"} />;
  else if (route === "analytics" && data.analytics && data.subscription) content = <AnalyticsDashboard analytics={data.analytics} subscription={data.subscription} />;
  else if (route === "analytics" && data.subscription) content = <UpgradeRequired title="Analitik lanjutan" description="Analitik funnel per organisasi tersedia pada paket Pro dan Business." />;
  else content = <ComingSoon title={slug[0] ?? "Module"} />;
  return (
    <FoundationShell
      organizationName={data.organization.name}
      persona={persona}
      userName={data.user.name}
    >
      {data.organization.status !== "ACTIVE" && <Card className="mb-6 border-danger-100 bg-danger-50 p-4"><p className="font-semibold text-danger-700">Organisasi ditangguhkan</p><p className="mt-1 text-sm text-text-secondary">Data lama tetap dapat ditinjau, tetapi tindakan komersial baru dinonaktifkan selama proses review TemuClient.</p></Card>}
      {content}
    </FoundationShell>
  );
}

function Dashboard({
  persona,
  organizationName,
}: {
  persona: "provider" | "buyer";
  organizationName: string;
}) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          persona === "provider" ? "Provider workspace" : "Buyer workspace"
        }
        title={`Halo, ${organizationName}`}
        description={
          persona === "provider"
            ? "Workspace Anda siap. Lengkapi kapabilitas perusahaan sebelum peluang terverifikasi tersedia di fase berikutnya."
            : "Workspace Anda siap. Pembuatan requirement akan tersedia pada fase Buyer Requirement."
        }
      />
      <EmptyState
        title={
          persona === "provider"
            ? "Belum ada opportunity"
            : "Belum ada requirement"
        }
        description="Foundation sudah aktif tanpa data demo atau metrik fiktif. Modul produk akan dibuka secara berurutan sesuai development plan."
        action={
          <Link
            className="text-sm font-semibold text-brand-700"
            href="/app/company"
          >
            Periksa profil perusahaan →
          </Link>
        }
      />
    </div>
  );
}

function Company({ data }: { data: FoundationData }) {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Company"
        description="Identitas organisasi yang digunakan di seluruh workspace."
        action={
          <div className="flex gap-4">
            <Link className="text-sm font-semibold text-brand-700" href="/app/company/verification">Verification</Link>
            <Link className="text-sm font-semibold text-brand-700" href="/app/settings/company">Edit company</Link>
          </div>
        }
      />
      <Card className="grid gap-6 p-6 sm:grid-cols-2">
        <Detail label="Nama" value={data.organization.name} />
        <Detail label="Tipe" value={data.organization.type} />
        <Detail label="Kota" value={data.organization.city} />
        <Detail label="Website" value={data.organization.website} />
        <div className="sm:col-span-2">
          <Detail label="Deskripsi" value={data.organization.description} />
        </div>
      </Card>
    </div>
  );
}

function SettingsNav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4 text-sm">
      {[
        ["Profile", "/app/settings/profile"],
        ["Company", "/app/settings/company"],
        ["Members", "/app/settings/members"],
        ["Security", "/app/settings/security"],
        ["Billing", "/app/settings/billing"],
      ].map(([label, href]) => (
        <Link
          className="rounded-md px-3 py-2 font-medium text-text-secondary hover:bg-surface-subtle"
          href={href}
          key={href}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function AnalyticsDashboard({ analytics, subscription }: { analytics: NonNullable<FoundationData["analytics"]>; subscription: NonNullable<FoundationData["subscription"]> }) {
  const rows = [["Opportunity Dilihat", analytics.opportunity_viewed], ["Opportunity Disimpan", analytics.opportunity_saved], ["Introduction Requested", analytics.introduction_requested], ["Introduction Accepted", analytics.introduction_accepted], ["Meeting", analytics.meeting_created], ["Proposal", analytics.proposal_submitted], ["Deal Won", analytics.deal_won]] as const;
  return <div className="space-y-6"><PageHeader eyebrow="Commercial funnel" title="Analytics" description="North Star: Qualified Introductions per Month. Seluruh data dibatasi pada organisasi aktif." action={<Badge tone="brand">{subscription.effectivePlan}</Badge>} /><Card className="p-5"><p className="text-xs text-text-muted">Qualified Introductions this month</p><p className="mt-2 text-3xl font-semibold tabular-nums">{analytics.qualifiedIntroductions}</p></Card><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map(([label, value]) => <Card className="p-4" key={label}><p className="text-xs text-text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></Card>)}</div></div>;
}

function Profile({ data }: { data: FoundationData }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: data.user.name },
  });
  async function submit(values: UpdateProfileInput) {
    setStatus("");
    const response = await fetch("/api/v1/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    setStatus(
      response.ok ? "Profil tersimpan." : "Profil belum dapat disimpan.",
    );
    if (response.ok) router.refresh();
  }
  return (
    <Settings title="Profile settings">
      <form className="max-w-xl space-y-5" onSubmit={form.handleSubmit(submit)}>
        <Field label="Nama">
          <Input {...form.register("name")} />
        </Field>
        <Field label="Email">
          <Input disabled value={data.user.email} />
        </Field>
        <p className="text-xs text-text-muted">
          Email akun tidak dapat diubah pada fase ini.
        </p>
        {status && <p className="text-sm text-text-secondary">{status}</p>}
        <Button disabled={form.formState.isSubmitting} type="submit">
          Simpan profil
        </Button>
      </form>
    </Settings>
  );
}

function CompanySettings({ data }: { data: FoundationData }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const canEdit = ["OWNER", "ADMIN"].includes(data.membership.role);
  const form = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: data.organization.name,
      website: data.organization.website ?? "",
      city: data.organization.city ?? "",
      description: data.organization.description ?? "",
      businessEmail: data.organization.businessEmail ?? "",
    },
  });
  if (!canEdit)
    return (
      <Settings title="Company settings">
        <Forbidden description="Hanya Owner atau Admin yang dapat mengubah profil perusahaan." />
      </Settings>
    );
  async function submit(values: UpdateOrganizationInput) {
    const response = await fetch(
      `/api/v1/organizations/${data.organization.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      },
    );
    setStatus(
      response.ok
        ? "Perusahaan tersimpan."
        : "Perusahaan belum dapat disimpan.",
    );
    if (response.ok) router.refresh();
  }
  return (
    <Settings title="Company settings">
      <form
        className="grid max-w-2xl gap-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(submit)}
      >
        <Field label="Nama perusahaan">
          <Input {...form.register("name")} />
        </Field>
        <Field label="Kota">
          <Input {...form.register("city")} />
        </Field>
        <Field label="Website">
          <Input {...form.register("website")} />
        </Field>
        <Field label="Email bisnis">
          <Input {...form.register("businessEmail")} />
        </Field>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Deskripsi</span>
          <textarea
            className="min-h-28 w-full rounded-md border bg-surface p-3 text-sm"
            {...form.register("description")}
          />
        </label>
        {status && (
          <p className="sm:col-span-2 text-sm text-text-secondary">{status}</p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit">Simpan perusahaan</Button>
        </div>
      </form>
    </Settings>
  );
}

function Members({ data }: { data: FoundationData }) {
  const canView = ["OWNER", "ADMIN"].includes(data.membership.role);
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteStatus, setInviteStatus] = useState("");
  const seats = data.subscription?.entitlements.teamSeats;
  async function invite(event: React.FormEvent) {
    event.preventDefault(); setInviteStatus("Mengirim undangan...");
    const response = await fetch(`/api/v1/organizations/${data.organization.id}/members`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) });
    const payload = await response.json();
    if (!response.ok) setInviteStatus(payload.error?.message ?? "Anggota belum dapat ditambahkan.");
    else { setInviteEmail(""); setInviteStatus("Undangan anggota berhasil dibuat."); router.refresh(); }
  }
  return (
    <Settings title="Members">
      {!canView ? (
        <Forbidden description="Hanya Owner atau Admin yang dapat melihat anggota organisasi." />
      ) : (
        <div className="space-y-4"><Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Kursi tim</p><p className="mt-1 text-sm text-text-secondary">{data.members.length} digunakan dari {seats ?? "tanpa batas"} • paket {data.subscription?.effectivePlan ?? "FREE"}</p></div><Badge tone={seats !== null && seats !== undefined && data.members.length >= seats ? "warning" : "success"}>{seats === null ? "Unlimited" : `${Math.max(0, (seats ?? 2) - data.members.length)} tersisa`}</Badge></div><form className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-[1fr_160px_auto]" onSubmit={invite}><Input aria-label="Email anggota" onChange={(event) => setInviteEmail(event.target.value)} placeholder="anggota@perusahaan.com" required type="email" value={inviteEmail}/><select aria-label="Role anggota" className="rounded-md border bg-surface px-3 text-sm" onChange={(event) => setInviteRole(event.target.value)} value={inviteRole}><option value="MEMBER">Member</option><option value="SALES">Sales</option><option value="ADMIN">Admin</option></select><Button disabled={seats !== null && seats !== undefined && data.members.length >= seats} type="submit">Tambah anggota</Button></form>{inviteStatus && <p className="mt-3 text-sm text-text-secondary" role="status">{inviteStatus}</p>}</Card><Card className="overflow-hidden">
          {data.members.map((member) => (
            <div
              className="flex items-center justify-between gap-4 border-b p-4 last:border-0"
              key={member.id}
            >
              <div>
                <p className="text-sm font-medium">{member.user.name}</p>
                <p className="text-xs text-text-muted">{member.user.email}</p>
              </div>
              <Badge tone={member.status === "ACTIVE" ? "success" : "neutral"}>
                {member.role}
              </Badge>
            </div>
          ))}
        </Card></div>
      )}
    </Settings>
  );
}

function Security({ data }: { data: FoundationData }) {
  return (
    <Settings title="Security">
      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Email verification</p>
            <p className="text-sm text-text-secondary">
              Status verifikasi identitas email.
            </p>
          </div>
          <Badge tone={data.user.emailVerifiedAt ? "success" : "warning"}>
            {data.user.emailVerifiedAt ? "Verified" : "Pending"}
          </Badge>
        </div>
        <div className="border-t pt-5">
          <p className="font-medium">Session</p>
          <p className="mt-1 text-sm text-text-secondary">
            Sesi ini disimpan sebagai token opaque, HTTP-only, dan dapat dicabut
            saat logout.
          </p>
        </div>
      </Card>
    </Settings>
  );
}

function Settings({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Kelola fondasi akun dan workspace Anda."
      />
      <SettingsNav />
      {children}
    </div>
  );
}
function Forbidden({
  description = "Tipe organisasi Anda tidak memiliki akses ke halaman ini.",
}: {
  description?: string;
}) {
  return (
    <Card className="border-danger-100 bg-danger-50 p-8">
      <p className="font-semibold text-danger-700">Akses ditolak</p>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </Card>
  );
}
function UpgradeRequired({ title, description }: { title: string; description: string }) {
  return <div className="space-y-6"><PageHeader eyebrow="Subscription" title={title} description={description} /><Card className="p-8 text-center"><p className="font-semibold">Upgrade paket diperlukan</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">Paket Free tetap dapat memakai fitur inti. Fitur ini dibuka setelah subscription Pro atau Business aktif.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-md bg-brand-600 px-5 text-sm font-semibold text-white" href="/app/settings/billing">Lihat paket</Link></Card></div>;
}
function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHeader
        title={title.replaceAll("-", " ")}
        description="Fondasi routing dan otorisasi telah tersedia."
      />
      <div className="mt-7">
        <EmptyState
          title="Akan hadir di fase berikutnya"
          description="Modul ini sengaja belum diimplementasikan agar pengembangan tetap mengikuti urutan fase dan acceptance gate."
        />
      </div>
    </>
  );
}
function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-6">{value || "Belum diisi"}</dd>
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
