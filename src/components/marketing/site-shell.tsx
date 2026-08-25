"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { TemuClientLogo } from "@/components/brand/temuclient-logo";

const navigation = [
  ["Untuk penyedia jasa", "/for-providers"],
  ["Untuk pencari vendor", "/for-buyers"],
  ["Insight", "/insight"],
  ["Harga", "/pricing"],
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-[#e7e4e5] bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
      <Link aria-label="TemuClient — Beranda" href="/"><TemuClientLogo className="[&>span]:text-[19px]" /></Link>
      <nav className="hidden items-center gap-9 text-[15px] font-medium text-[#263336] md:flex">
        {navigation.map(([label, href]) => <Link className="transition-colors hover:text-[#d83267]" href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="hidden items-center gap-3 md:flex">
        <Link className="flex min-h-11 items-center px-4 text-sm font-semibold text-[#071518]" href="/login">Masuk</Link>
        <Link className="flex min-h-11 items-center rounded-full bg-[#071518] px-6 text-sm font-semibold text-white transition hover:bg-[#d83267]" href="/register">Mulai gratis</Link>
      </div>
      <button aria-expanded={open} aria-label="Buka menu" className="flex size-11 items-center justify-center md:hidden" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
    </div>
    {open && <div className="fixed inset-0 z-50 min-h-screen bg-white p-5 md:hidden">
      <div className="flex items-center justify-between"><TemuClientLogo /><button aria-label="Tutup menu" className="flex size-11 items-center justify-center" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
      <nav className="mt-10">
        {[...navigation, ["Masuk", "/login"] as const, ["Mulai gratis", "/register"] as const].map(([label, href]) => <Link className="block border-b border-[#e7e4e5] py-5 text-xl font-medium" href={href} key={href}>{label}</Link>)}
      </nav>
    </div>}
  </header>;
}

export function MarketingFooter() {
  return <footer className="border-t border-[#dfe3e3] bg-[#071518] text-white">
    <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12 lg:py-20">
      <div><TemuClientLogo inverse /><p className="mt-5 max-w-sm text-sm leading-6 text-white/65">Jaringan opportunity B2B terverifikasi untuk perusahaan Indonesia yang ingin menemukan kebutuhan dan keahlian yang tepat.</p></div>
      <FooterColumn title="Untuk penyedia jasa" links={[["Cari client", "/for-providers"], ["Opportunity", "/app/opportunities"], ["Harga", "/pricing"]]} />
      <FooterColumn title="Untuk perusahaan" links={[["Cari vendor", "/for-buyers"], ["Buat kebutuhan", "/onboarding"], ["Insight", "/insight"]]} />
      <FooterColumn title="TemuClient" links={[["Masuk", "/login"], ["Buat akun", "/register"], ["Sitemap", "/sitemap.xml"]]} />
    </div>
    <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-white/45">© 2026 TemuClient. Verified B2B Opportunity Network.</div>
  </footer>;
}

function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div><p className="text-sm font-semibold text-white">{title}</p><div className="mt-5 space-y-3 text-sm text-white/60">{links.map(([label, href]) => <Link className="block transition hover:text-white" href={href} key={href}>{label}</Link>)}</div></div>;
}
