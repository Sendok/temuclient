"use client";

import { BarChart3, Bell, Bot, BriefcaseBusiness, Building2, CalendarDays, ChevronsLeft, CircleHelp, Home, LogOut, Menu, MessageSquare, Network, Search, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { TemuClientLogo } from "@/components/brand/temuclient-logo";

const providerNav = [["Overview", "/app", Home], ["Opportunities", "/app/opportunities", Search], ["Introductions", "/app/introductions", Network], ["Deals", "/app/deals", BriefcaseBusiness], ["Messages", "/app/messages", MessageSquare], ["Meetings", "/app/meetings", CalendarDays], ["AI Sales", "/app/ai-sales", Bot], ["Company Profile", "/app/company", Building2], ["Analytics", "/app/analytics", BarChart3]] as const;
const buyerNav = [["Overview", "/app", Home], ["Requirements", "/app/requirements", Search], ["Providers", "/app/providers", Users], ["Introductions", "/app/introductions", Network], ["Messages", "/app/messages", MessageSquare], ["Meetings", "/app/meetings", CalendarDays], ["Company", "/app/company", Building2]] as const;

export function FoundationShell({ persona, organizationName, userName, children }: { persona: "provider" | "buyer"; organizationName: string; userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const nav = persona === "provider" ? providerNav : buyerNav;
  const mobileNav = persona === "provider"
    ? [["Home", "/app", Home], ["Opportunities", "/app/opportunities", Search], ["Deals", "/app/deals", BriefcaseBusiness], ["Messages", "/app/messages", MessageSquare]] as const
    : [["Home", "/app", Home], ["Requirements", "/app/requirements", Search], ["Providers", "/app/providers", Users], ["Messages", "/app/messages", MessageSquare]] as const;
  const initials = userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  async function logout() { await fetch("/api/v1/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }

  return <div className="min-h-screen bg-background">
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-surface transition-[width] lg:flex", collapsed ? "w-[72px]" : "w-64")}>
      <Link aria-label="TemuClient workspace" className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center")} href="/app"><TemuClientLogo compact={collapsed} /></Link>
      <div className="border-b px-4 py-4">{collapsed ? <Building2 className="mx-auto size-4 text-text-muted" /> : <><p className="truncate text-sm font-semibold">{organizationName}</p><p className="mt-1 text-xs text-text-muted">{persona === "provider" ? "Provider workspace" : "Buyer workspace"}</p></>}</div>
      <Navigation collapsed={collapsed} nav={nav} pathname={pathname} />
      <div className="space-y-1 border-t p-3"><ShellLink collapsed={collapsed} href="/app/notifications" icon={Bell} label="Notifications" /><ShellLink collapsed={collapsed} href="/app/settings/profile" icon={Settings} label="Settings" /><ShellLink collapsed={collapsed} href="/app/help" icon={CircleHelp} label="Help" /><button className={cn("flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-text-secondary hover:bg-surface-subtle", collapsed && "justify-center px-0")} onClick={logout} title={collapsed ? "Keluar" : undefined}><LogOut className="size-4" />{!collapsed && "Keluar"}</button></div>
      <button aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"} className="absolute -right-3 top-20 flex size-6 items-center justify-center rounded-full border bg-surface" onClick={() => setCollapsed((value) => !value)}><ChevronsLeft className={cn("size-3", collapsed && "rotate-180")} /></button>
    </aside>
    <div className={cn("transition-[padding]", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-surface/95 px-4 backdrop-blur sm:px-6"><button aria-label="Buka navigasi" className="flex size-10 items-center justify-center rounded-md border lg:hidden" onClick={() => setMobile(true)}><Menu className="size-4" /></button><div className="hidden lg:block"><p className="text-xs text-text-muted">Workspace aktif</p><p className="text-sm font-semibold">{organizationName}</p></div><div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-sm font-medium">{userName}</span><span className="block text-xs text-text-muted">Asia/Jakarta</span></span><span className="flex size-9 items-center justify-center rounded-full bg-text-primary text-xs font-semibold text-white">{initials}</span></div></header><main className="mx-auto max-w-6xl px-4 py-7 pb-24 sm:px-6 lg:px-8">{children}</main></div>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">{mobileNav.map(([label, href, Icon]) => <Link className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] text-text-secondary" href={href} key={label}><Icon className="size-4" />{label}</Link>)}<button className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] text-text-secondary" onClick={() => setMobile(true)}><Menu className="size-4" />More</button></nav>
    {mobile && <div className="fixed inset-0 z-50 bg-text-primary/30 lg:hidden" onClick={() => setMobile(false)}><aside className="absolute inset-y-0 left-0 w-[84%] max-w-xs overflow-y-auto bg-surface" onClick={(event) => event.stopPropagation()}><div className="flex h-16 items-center justify-between border-b px-5"><b>TemuClient</b><button aria-label="Tutup navigasi" onClick={() => setMobile(false)}><X className="size-5" /></button></div><div className="px-5 py-4 text-sm font-semibold">{organizationName}</div><Navigation nav={nav} pathname={pathname} onNavigate={() => setMobile(false)} /><div className="border-t p-3"><ShellLink href="/app/notifications" icon={Bell} label="Notifications" /><ShellLink href="/app/settings/profile" icon={Settings} label="Settings" /><ShellLink href="/app/help" icon={CircleHelp} label="Help" /><button className="flex min-h-11 w-full items-center gap-3 px-3 text-sm" onClick={logout}><LogOut className="size-4" />Keluar</button></div></aside></div>}
  </div>;
}

function Navigation({ nav, pathname, onNavigate, collapsed = false }: { nav: typeof providerNav | typeof buyerNav; pathname: string; onNavigate?: () => void; collapsed?: boolean }) { return <nav className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(([label, href, Icon]) => { const active = href === "/app" ? pathname === href : pathname.startsWith(href); return <Link className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium", active ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-surface-subtle", collapsed && "justify-center px-0")} href={href} key={label} onClick={onNavigate} title={collapsed ? label : undefined}><Icon className="size-4 shrink-0" />{!collapsed && label}</Link>; })}</nav>; }
function ShellLink({ href, icon: Icon, label, collapsed = false }: { href: string; icon: typeof Bell; label: string; collapsed?: boolean }) { return <Link className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-text-secondary hover:bg-surface-subtle", collapsed && "justify-center px-0")} href={href} title={collapsed ? label : undefined}><Icon className="size-4" />{!collapsed && label}</Link>; }
