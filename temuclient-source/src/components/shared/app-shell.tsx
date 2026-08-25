"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, Bot, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, ChevronsLeft,
  CircleHelp, Command, FileText, Home, Menu, MessageSquare, Network, Search, Settings,
  ShieldCheck, SlidersHorizontal, Users, X,
} from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { TemuClientLogo } from "@/components/brand/temuclient-logo";

export type PrototypePersona = "provider" | "buyer" | "admin";

const navByPersona = {
  provider: [
    ["Overview", "/app", Home], ["Opportunities", "/app/opportunities", Search], ["Introductions", "/app/introductions", Network],
    ["Deals", "/app/deals", BriefcaseBusiness], ["Messages", "/app/messages", MessageSquare], ["Meetings", "/app/meetings", CalendarDays],
    ["AI Sales", "/app/ai-sales", Bot], ["Company", "/app/company", Building2],
  ],
  buyer: [
    ["Overview", "/app?persona=buyer", Home], ["Requirements", "/app/requirements?persona=buyer", FileText],
    ["Providers", "/app/requirements/warehouse-management/matches?persona=buyer", Users], ["Introductions", "/app/introductions?persona=buyer", Network],
    ["Messages", "/app/messages?persona=buyer", MessageSquare], ["Meetings", "/app/meetings?persona=buyer", CalendarDays],
    ["Company", "/app/company?persona=buyer", Building2],
  ],
  admin: [
    ["Overview", "/admin", Home], ["Companies", "/admin/companies", Building2], ["Opportunities", "/admin/opportunities", BriefcaseBusiness],
    ["Verification", "/admin/verifications", ShieldCheck], ["Audit Log", "/admin/audit-logs", FileText],
  ],
} as const;

function PersonaSwitcher({ persona }: { persona: PrototypePersona }) {
  const router = useRouter();
  return <label className="block"><span className="sr-only">Pilih persona demo</span><select className="w-full rounded-md border bg-surface px-2 py-2 text-xs font-medium" onChange={(event) => {
    const value = event.target.value as PrototypePersona;
    router.push(value === "admin" ? "/admin" : value === "buyer" ? "/app?persona=buyer" : "/app");
  }} value={persona}><option value="provider">Provider Demo</option><option value="buyer">Buyer Demo</option><option value="admin">Admin Demo</option></select></label>;
}

export function AppShell({ persona, children }: { persona: PrototypePersona; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const nav = navByPersona[persona];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
      if (event.key === "Escape") { setCommandOpen(false); setNotificationsOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commands = useMemo(() => [
    { label: "Cari Opportunity", href: "/app/opportunities" }, { label: "Buka Deals", href: "/app/deals" },
    { label: "Buat Requirement", href: "/app/requirements/new?persona=buyer" }, { label: "Buka Settings", href: "/app/settings/profile" },
    { label: "Design System", href: "/design-system" },
  ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className="min-h-screen bg-background">
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r bg-surface transition-[width] duration-150 lg:flex lg:flex-col", collapsed ? "w-[72px]" : "w-64")}>
      <div className="flex h-16 items-center border-b px-4"><TemuClientLogo compact={collapsed} /></div>
      <div className="border-b p-3">{collapsed ? <button aria-label="Ubah persona" className="flex size-10 items-center justify-center rounded-md border"><Building2 className="size-4" /></button> : <PersonaSwitcher persona={persona} />}</div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(([label, href, Icon]) => {
        const targetPath = href.split("?")[0];
        const active = targetPath === "/app" || targetPath === "/admin" ? pathname === targetPath : pathname.startsWith(targetPath);
        return <Link className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition", active ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary", collapsed && "justify-center px-0")} href={href} key={label} title={collapsed ? label : undefined}><Icon className="size-4 shrink-0" />{!collapsed && <span>{label}</span>}</Link>;
      })}</nav>
      <div className="space-y-1 border-t p-3"><button className={cn("flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-text-secondary hover:bg-surface-subtle", collapsed && "justify-center px-0")} onClick={() => setNotificationsOpen(true)}><Bell className="size-4" />{!collapsed && <><span>Notifications</span><Badge tone="brand" className="ml-auto">3</Badge></>}</button><Link className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-text-secondary hover:bg-surface-subtle", collapsed && "justify-center px-0")} href="/design-system"><SlidersHorizontal className="size-4" />{!collapsed && "Design System"}</Link><button className={cn("flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-text-secondary hover:bg-surface-subtle", collapsed && "justify-center px-0")}><Settings className="size-4" />{!collapsed && "Settings"}</button></div>
      <button aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"} className="absolute -right-3 top-20 flex size-6 items-center justify-center rounded-full border bg-surface text-text-muted" onClick={() => setCollapsed((value) => !value)}><ChevronsLeft className={cn("size-3.5 transition", collapsed && "rotate-180")} /></button>
    </aside>

    <div className={cn("transition-[padding] duration-150", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-surface/95 px-4 backdrop-blur sm:px-6"><div className="flex items-center gap-3"><button aria-label="Buka navigasi" className="flex size-10 items-center justify-center rounded-md border lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="size-4" /></button><div className="hidden sm:block"><p className="text-xs text-text-muted">Workspace</p><button className="flex items-center gap-1 text-sm font-semibold">{persona === "provider" ? "Sagara Software" : persona === "buyer" ? "PT Nusantara Logistik" : "TemuClient Operations"}<ChevronDown className="size-3.5" /></button></div></div><div className="flex items-center gap-2"><button className="hidden min-h-10 w-56 items-center gap-2 rounded-md border px-3 text-left text-sm text-text-muted lg:flex" onClick={() => setCommandOpen(true)}><Search className="size-4" /><span>Cari atau pindah…</span><kbd className="ml-auto rounded border px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button><button aria-label="Notifikasi" className="relative flex size-10 items-center justify-center rounded-md border" onClick={() => setNotificationsOpen(true)}><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger-600" /></button><button aria-label="Menu pengguna" className="flex size-10 items-center justify-center rounded-full bg-text-primary text-xs font-semibold text-white">AR</button></div></header>
      <main className="mx-auto max-w-[1500px] px-4 py-6 pb-24 sm:px-6 md:pb-8 lg:px-8">{children}</main>
    </div>

    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">{nav.slice(0, 4).map(([label, href, Icon]) => <Link className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium text-text-secondary" href={href} key={label}><Icon className="size-4" />{label}</Link>)}<button className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium text-text-secondary" onClick={() => setMobileOpen(true)}><Menu className="size-4" />More</button></nav>

    {mobileOpen && <div className="fixed inset-0 z-50 bg-text-primary/30 lg:hidden" onClick={() => setMobileOpen(false)}><aside aria-label="Navigasi mobile" className="absolute inset-y-0 left-0 w-[84%] max-w-xs bg-surface p-4" onClick={(event) => event.stopPropagation()}><div className="mb-6 flex items-center justify-between"><span className="font-semibold">TemuClient</span><button aria-label="Tutup navigasi" className="flex size-10 items-center justify-center" onClick={() => setMobileOpen(false)}><X className="size-5" /></button></div><PersonaSwitcher persona={persona} /><div className="mt-5 space-y-1">{nav.map(([label, href, Icon]) => <Link className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-surface-subtle" href={href} key={label} onClick={() => setMobileOpen(false)}><Icon className="size-4" />{label}</Link>)}</div><Link className="mt-4 flex min-h-11 items-center gap-3 border-t px-3 pt-4 text-sm" href="/design-system"><SlidersHorizontal className="size-4" />Design System</Link></aside></div>}

    {commandOpen && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-text-primary/35 px-4 pt-[12vh]" onClick={() => setCommandOpen(false)}><div aria-label="Command palette" aria-modal="true" className="w-full max-w-xl overflow-hidden rounded-xl border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog"><div className="flex items-center gap-3 border-b px-4"><Command className="size-4 text-text-muted" /><input autoFocus className="h-14 flex-1 bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Cari navigasi, opportunity, atau deal…" value={query} /><kbd className="text-xs text-text-muted">ESC</kbd></div><div className="p-2">{commands.map((item) => <button className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-surface-subtle" key={item.href} onClick={() => { setCommandOpen(false); router.push(item.href); }}><Search className="size-4 text-text-muted" />{item.label}</button>)}</div></div></div>}

    {notificationsOpen && <div className="fixed inset-0 z-[60] bg-text-primary/25" onClick={() => setNotificationsOpen(false)}><aside aria-label="Notifikasi" className="absolute inset-y-0 right-0 w-full max-w-sm border-l bg-surface p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="font-semibold">Notifications</h2><p className="text-xs text-text-muted">3 belum dibaca</p></div><button aria-label="Tutup notifikasi" className="flex size-10 items-center justify-center" onClick={() => setNotificationsOpen(false)}><X className="size-5" /></button></div><button className="mt-4 text-xs font-semibold text-brand-700">Tandai semua dibaca</button><div className="mt-5 space-y-3">{["Opportunity baru dengan Match 94%", "Introduction diterima PT Nusantara", "Meeting dimulai besok pukul 10.00"].map((item, index) => <div className="rounded-lg border p-4" key={item}><div className="flex gap-3"><span className="mt-1 size-2 rounded-full bg-brand-500" /><div><p className="text-sm font-medium">{item}</p><p className="mt-1 text-xs text-text-muted">{index + 1} jam lalu</p></div></div></div>)}</div><div className="absolute bottom-5 left-5 right-5 flex items-center gap-2 rounded-lg border bg-surface-subtle p-3 text-xs text-text-secondary"><CircleHelp className="size-4" />Prototype notification — tidak mengirim data.</div></aside></div>}
  </div>;
}
