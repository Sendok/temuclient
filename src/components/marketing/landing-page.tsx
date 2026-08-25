import { ArrowRight, Check, ChevronDown, Clock3, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { MarketingFooter, MarketingNav } from "@/components/marketing/site-shell";

const steps = [
  ["01", "Jelaskan kebutuhan yang nyata.", "Perusahaan menuliskan masalah bisnis, budget, timeline, dan hasil yang ingin dicapai."],
  ["02", "Temukan kecocokan yang bisa dijelaskan.", "Matching menilai layanan, industri, budget, portfolio, kapasitas, dan lokasi secara transparan."],
  ["03", "Berkenalan saat kedua pihak siap.", "Kontak pribadi tetap terlindungi sampai Introduction diterima dan percakapan bisnis dimulai."],
] as const;

const providerBenefits = [
  ["01", "Opportunity sesuai layanan, bukan daftar kontak acak."],
  ["02", "Ketahui alasan kecocokan sebelum mengejar client."],
  ["03", "Bicara langsung setelah buyer menerima perkenalan."],
  ["04", "Kelola meeting dan deal dalam satu alur yang jelas."],
] as const;

export function LandingPage() {
  return <div className="marketing-theme bg-white text-[#071518]"><MarketingNav /><main>
    <section className="relative overflow-hidden border-b border-[#eadfe3] bg-[radial-gradient(circle_at_50%_15%,#fff1f5_0%,#ffffff_58%)]">
      <div className="pointer-events-none absolute left-[7%] top-44 hidden rounded-full border border-[#e7e4e5] bg-white px-5 py-3 text-xs font-semibold shadow-[0_10px_30px_rgba(7,21,24,0.08)] lg:block"><span className="mr-2 inline-block size-2 rounded-full bg-emerald-400" />Kebutuhan baru terverifikasi</div>
      <div className="pointer-events-none absolute right-[8%] top-56 hidden rounded-full border border-[#e7e4e5] bg-white px-5 py-3 text-xs font-semibold shadow-[0_10px_30px_rgba(7,21,24,0.08)] lg:block"><span className="mr-2 inline-block size-2 rounded-full bg-[#d83267]" />3 provider cocok</div>
      <div className="mx-auto max-w-[1220px] px-5 pb-10 pt-20 text-center sm:px-8 lg:pb-14 lg:pt-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d83267]">Verified B2B Opportunity Network</p>
        <h1 className="mx-auto mt-7 max-w-5xl text-[clamp(3rem,7vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.055em]">Kebutuhan bisnis yang nyata.<br /><em className="font-normal text-[#d83267]">Keahlian yang tepat.</em></h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#536063] sm:text-xl">TemuClient mempertemukan perusahaan yang membutuhkan solusi dengan penyedia jasa yang paling relevan—berdasarkan konteks, bukti, dan kesiapan.</p>
      </div>
      <div className="mx-auto grid max-w-[1160px] gap-4 px-5 pb-20 sm:px-8 lg:grid-cols-2">
        <AudienceCard kind="buyer" />
        <AudienceCard kind="provider" />
      </div>
    </section>

    <section className="border-b border-[#e7e4e5] bg-[#fbfaf9]"><div className="mx-auto max-w-[1160px] px-5 py-14 text-center sm:px-8"><p className="text-lg font-medium tracking-[-0.02em]">Dibangun untuk keputusan B2B yang lebih berkualitas.</p><div className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-semibold text-[#687477]"><span>Software House</span><span>Konsultan IT</span><span>ERP & CRM</span><span>Cybersecurity</span><span>Cloud & Data</span><span>AI Development</span></div></div></section>

    <section className="bg-[#071518] text-white"><div className="mx-auto max-w-[1160px] px-5 py-20 sm:px-8 lg:py-28"><div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-sm font-semibold text-[#ff7eaa]">Untuk perusahaan yang mencari vendor</p><h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">Bangun shortlist berdasarkan kebutuhan, bukan popularitas.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">Ceritakan masalah bisnis sekali. TemuClient membantu qualification, matching, dan introduction dengan beberapa provider yang kredibel.</p><Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#d83267] px-6 text-sm font-semibold text-white" href="/for-buyers">Mulai mencari vendor <ArrowRight className="size-4" /></Link></div><div className="grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 sm:grid-cols-3">{steps.map(([number, title, copy]) => <div className="bg-[#0b1b1e] p-6 lg:p-7" key={number}><p className="font-mono text-xs text-[#ff7eaa]">{number}</p><h3 className="mt-12 text-xl font-medium leading-7">{title}</h3><p className="mt-4 text-sm leading-6 text-white/55">{copy}</p></div>)}</div></div></div></section>

    <section className="overflow-hidden bg-[#fff5f8]"><div className="mx-auto grid max-w-[1160px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28"><OpportunityBoard /><div><p className="text-sm font-semibold text-[#d83267]">Untuk penyedia jasa</p><h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">Temukan client yang memang sedang membutuhkan Anda.</h2><p className="mt-6 text-lg leading-8 text-[#596568]">Lihat opportunity yang punya konteks, intent, dan alasan kecocokan. Tidak ada scraping kontak atau blast pesan.</p><Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#071518] px-6 text-sm font-semibold text-white" href="/for-providers">Lihat cara kerjanya <ArrowRight className="size-4" /></Link></div></div><div className="mx-auto grid max-w-[1160px] gap-px border-t border-[#e6d9de] bg-[#e6d9de] sm:grid-cols-2 lg:grid-cols-4">{providerBenefits.map(([number, title]) => <div className="bg-[#fff5f8] px-5 py-8 sm:px-7" key={number}><p className="font-mono text-xs text-[#d83267]">{number}</p><h3 className="mt-7 font-medium leading-6">{title}</h3></div>)}</div></section>

    <section className="bg-white"><div className="mx-auto max-w-[980px] px-5 py-20 sm:px-8 lg:py-28"><div className="text-center"><p className="text-sm font-semibold text-[#d83267]">Mengapa TemuClient</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Signal yang membantu Anda memutuskan.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-3"><SignalCard value="94%" title="Match Score" copy="Kecocokan capability dan konteks bisnis." /><SignalCard value="92" title="Buyer Intent" copy="Kesiapan kebutuhan untuk bergerak ke meeting." /><SignalCard value="4/5" title="Verification" copy="Bukti perusahaan, kebutuhan, dan budget." /></div></div></section>

    <section className="border-y border-[#e7e4e5] bg-[#fbfaf9]"><div className="mx-auto max-w-4xl px-5 py-20 sm:px-8"><p className="text-sm font-semibold text-[#d83267]">FAQ</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.04em]">Pertanyaan umum.</h2><div className="mt-10 divide-y divide-[#dfe3e3] border-y border-[#dfe3e3]">{faq.map(([question, answer], index) => <details className="group py-6" key={question} open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">{question}<ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" /></summary><p className="mt-4 max-w-3xl leading-7 text-[#5d686b]">{answer}</p></details>)}</div></div></section>

    <section className="bg-[#d83267] text-white"><div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 lg:py-24"><h2 className="text-4xl font-medium tracking-[-0.04em] sm:text-6xl">Pertemuan bisnis berikutnya dimulai di sini.</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">Cari client yang tepat atau temukan vendor yang siap membantu kebutuhan perusahaan Anda.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link className="flex min-h-12 items-center justify-center rounded-full bg-[#071518] px-7 text-sm font-semibold" href="/register">Mulai gratis <ArrowRight className="ml-2 size-4" /></Link><Link className="flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 text-sm font-semibold" href="/for-buyers">Saya mencari vendor</Link></div></div></section>
  </main><MarketingFooter /></div>;
}

function AudienceCard({ kind }: { kind: "buyer" | "provider" }) {
  const buyer = kind === "buyer";
  return <Link className={`group relative min-h-[430px] overflow-hidden rounded-[24px] border p-7 transition-transform hover:-translate-y-1 sm:p-9 ${buyer ? "border-[#1c292c] bg-[#071518] text-white" : "border-[#f0d8e0] bg-[#fff1f5] text-[#071518]"}`} href={buyer ? "/for-buyers" : "/for-providers"}>
    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${buyer ? "text-[#ff8bb2]" : "text-[#d83267]"}`}>{buyer ? "Untuk perusahaan" : "Untuk penyedia jasa"}</p>
    <h2 className="mt-4 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">{buyer ? <>Temukan <em className="font-normal text-[#ff8bb2]">vendor tepat.</em></> : <>Temukan <em className="font-normal text-[#d83267]">client tepat.</em></>}</h2>
    <p className={`mt-4 max-w-md leading-7 ${buyer ? "text-white/60" : "text-[#5d686b]"}`}>{buyer ? "Jelaskan kebutuhan dan dapatkan shortlist provider yang relevan." : "Bangun pipeline dari kebutuhan bisnis yang terverifikasi."}</p>
    <span className={`mt-7 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ${buyer ? "bg-[#d83267] text-white" : "bg-[#071518] text-white"}`}>{buyer ? "Mulai mencari vendor" : "Mulai mencari client"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
    <div className={`absolute inset-x-7 bottom-[-22px] rounded-t-xl border p-4 shadow-2xl sm:inset-x-9 ${buyer ? "border-white/15 bg-[#102326]" : "border-[#ead7de] bg-white"}`}>
      <div className="flex items-center justify-between text-xs"><span className="font-semibold">{buyer ? "Requirement siap dipublish" : "Match baru untuk Anda"}</span><span className={buyer ? "text-[#8ff0c2]" : "text-[#d83267]"}>{buyer ? "Terverifikasi" : "94% match"}</span></div>
      <div className={`mt-4 rounded-lg border p-4 ${buyer ? "border-white/10 bg-white/5" : "border-[#ece6e8] bg-[#fbfaf9]"}`}><p className="font-medium">Warehouse Management System</p><div className={`mt-3 flex flex-wrap gap-4 text-xs ${buyer ? "text-white/50" : "text-[#687477]"}`}><span className="flex items-center gap-1"><MapPin className="size-3" /> Surabaya</span><span className="flex items-center gap-1"><Clock3 className="size-3" /> 4–6 bulan</span><span className="flex items-center gap-1"><ShieldCheck className="size-3" /> Verified</span></div></div>
    </div>
  </Link>;
}

function OpportunityBoard() {
  return <div className="rounded-2xl border border-[#e8dce0] bg-white p-4 shadow-[0_28px_80px_rgba(58,29,40,0.12)] sm:p-5"><div className="flex items-center justify-between border-b pb-4"><div><p className="text-xs text-[#7b8587]">Opportunity untuk Anda</p><p className="mt-1 font-semibold">Matching intelligence</p></div><span className="flex items-center gap-1 rounded-full bg-[#eafbf2] px-3 py-1 text-xs font-semibold text-emerald-700"><Sparkles className="size-3" /> Live</span></div>{[["Warehouse Management System","Logistics · Surabaya","94%"],["ERP Integration Program","Manufacturing · Bekasi","89%"],["Customer Data Platform","Retail · Jakarta","84%"]].map(([title,meta,score]) => <div className="grid grid-cols-[1fr_auto] gap-4 border-b py-5 last:border-0" key={title}><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-[#768083]">{meta}</p></div><div className="text-right"><p className="text-lg font-semibold text-[#d83267]">{score}</p><p className="text-[11px] text-[#8a9395]">match</p></div></div>)}</div>;
}

function SignalCard({ value, title, copy }: { value: string; title: string; copy: string }) {
  return <div className="rounded-2xl border border-[#dfe3e3] bg-white p-7"><p className="text-5xl font-medium tracking-[-0.05em] text-[#d83267]">{value}</p><h3 className="mt-8 text-lg font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-[#657174]">{copy}</p><p className="mt-7 flex items-center gap-2 text-xs font-semibold text-emerald-700"><Check className="size-4" /> Dapat dijelaskan</p></div>;
}

const faq = [
  ["Apakah TemuClient menjual database kontak?", "Tidak. TemuClient membuka koneksi melalui Introduction yang dikontrol buyer. Kontak pribadi tidak dibuka sebelum perkenalan diterima."],
  ["Apakah TemuClient mengambil persen dari deal?", "Tidak. Pada tahap awal TemuClient tidak memotong nilai proyek yang diperoleh provider."],
  ["Bagaimana Match Score ditentukan?", "V1 memakai perhitungan deterministik dari layanan, industri, budget, portfolio, teknologi, kapasitas, lokasi, dan availability."],
  ["Apakah AI menghubungi calon client otomatis?", "Tidak. AI hanya membantu menyusun analisis atau draft. Semua materi harus ditinjau manusia dan tidak pernah dikirim otomatis."],
] as const;
