import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  EyeOff,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";

import { MarketingFooter, MarketingNav } from "@/components/marketing/site-shell";

type AudienceKind = "provider" | "buyer";

const content = {
  provider: {
    eyebrow: "Untuk penyedia jasa",
    title: <>Client baru dimulai dari <em className="font-normal text-[#d83267]">kebutuhan yang nyata.</em></>,
    copy: "TemuClient membantu software house, konsultan, dan agency menemukan perusahaan yang memang sedang membutuhkan keahlian mereka.",
    cta: "Mulai mencari client",
    ctaHref: "/register",
    secondary: "Lihat alur kerja",
    definitionTitle: "Sederhananya, siapa itu penyedia jasa?",
    definition: "Perusahaan yang menjual keahlian atau layanan—misalnya software house, konsultan ERP, agency digital, spesialis cloud, data, AI, atau keamanan siber.",
    sectionEyebrow: "Pipeline yang lebih berkualitas",
    sectionTitle: "Berhenti mengejar daftar kontak. Mulai dari alasan untuk berbicara.",
    sectionCopy: "Setiap opportunity membawa konteks yang dibutuhkan tim sales untuk memilih fokus dan menyiapkan pendekatan yang relevan.",
    stats: [["94%", "Match Score"], ["92", "Buyer Intent"], ["4/5", "Verification"]],
    steps: [
      ["01", "Lengkapi kemampuan", "Definisikan layanan, industri, teknologi, portfolio, dan kapasitas tim."],
      ["02", "Terima match", "Lihat opportunity yang relevan beserta alasan kecocokannya."],
      ["03", "Minta perkenalan", "Kirim konteks pendekatan. Buyer tetap mengontrol siapa yang dikenalkan."],
      ["04", "Bawa ke deal", "Lanjutkan percakapan, meeting, dan pipeline setelah introduction diterima."],
    ],
  },
  buyer: {
    eyebrow: "Untuk perusahaan yang mencari vendor",
    title: <>Vendor yang tepat dimulai dari <em className="font-normal text-[#d83267]">masalah yang jelas.</em></>,
    copy: "Jelaskan kebutuhan bisnis satu kali. TemuClient membantu Anda membangun shortlist penyedia jasa yang relevan, kredibel, dan siap diajak berdiskusi.",
    cta: "Mulai mencari vendor",
    ctaHref: "/register",
    secondary: "Lihat cara memilih vendor",
    definitionTitle: "Sederhananya, siapa itu pencari vendor?",
    definition: "Perusahaan yang punya masalah, target, atau proyek dan membutuhkan pihak luar untuk membantu—mulai dari membuat software sampai implementasi ERP, cloud, data, atau keamanan.",
    sectionEyebrow: "Shortlist yang bisa dipertanggungjawabkan",
    sectionTitle: "Bandingkan berdasarkan kebutuhan, bukan siapa yang paling keras menjual.",
    sectionCopy: "Requirement, bukti pengalaman, kemampuan, budget, dan kesiapan menjadi dasar pemilihan. Kontak Anda tetap terlindungi selama proses awal.",
    stats: [["3–5", "Provider shortlist"], ["8", "Faktor matching"], ["100%", "Buyer control"]],
    steps: [
      ["01", "Ceritakan masalah", "Susun tujuan, ruang lingkup, budget, timeline, dan hasil yang diharapkan."],
      ["02", "Kebutuhan dikualifikasi", "Signal kesiapan dan kelengkapan membantu provider memahami konteks."],
      ["03", "Bandingkan shortlist", "Tinjau kecocokan, pengalaman, kemampuan, serta alasan rekomendasi."],
      ["04", "Pilih perkenalan", "Anda menentukan provider yang boleh masuk ke percakapan bisnis."],
    ],
  },
} as const;

export function AudiencePage({ kind }: { kind: AudienceKind }) {
  const page = content[kind];
  const provider = kind === "provider";

  return <div className="marketing-theme bg-white text-[#071518]">
    <MarketingNav />
    <main>
      <section className="overflow-hidden border-b border-[#eadfe3] bg-[radial-gradient(circle_at_75%_25%,#fff1f5_0%,#ffffff_48%)]">
        <div className="mx-auto grid max-w-[1160px] items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[0.94fr_1.06fr] lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d83267]">{page.eyebrow}</p>
            <h1 className="mt-7 text-[clamp(3rem,6vw,5.25rem)] font-medium leading-[0.98] tracking-[-0.055em]">{page.title}</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#596568] sm:text-xl">{page.copy}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#071518] px-6 text-sm font-semibold text-white transition hover:bg-[#d83267]" href={page.ctaHref}>{page.cta}<ArrowRight className="size-4" /></Link>
              <a className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cfd3d3] px-6 text-sm font-semibold" href="#cara-kerja">{page.secondary}</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[#687477]">
              <span className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Tanpa database kontak</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />Privasi sejak awal</span>
            </div>
          </div>
          {provider ? <ProviderPreview /> : <BuyerPreview />}
        </div>
      </section>

      <section className="border-b border-[#e7e4e5] bg-[#fbfaf9]">
        <div className="mx-auto grid max-w-[1160px] gap-8 px-5 py-14 sm:px-8 md:grid-cols-[0.72fr_1.28fr] md:items-start">
          <p className="text-sm font-semibold text-[#d83267]">{page.definitionTitle}</p>
          <p className="text-2xl font-medium leading-9 tracking-[-0.025em] sm:text-3xl sm:leading-10">{page.definition}</p>
        </div>
      </section>

      <section className={provider ? "bg-[#fff4f7]" : "bg-[#071518] text-white"}>
        <div className="mx-auto max-w-[1160px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className={`text-sm font-semibold ${provider ? "text-[#d83267]" : "text-[#ff8bb2]"}`}>{page.sectionEyebrow}</p>
              <h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">{page.sectionTitle}</h2>
            </div>
            <p className={`max-w-xl text-lg leading-8 ${provider ? "text-[#5d686b]" : "text-white/65"}`}>{page.sectionCopy}</p>
          </div>
          <div className={`mt-12 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-3 ${provider ? "border-[#e8d9de] bg-[#e8d9de]" : "border-white/15 bg-white/15"}`}>
            {page.stats.map(([value, label]) => <div className={provider ? "bg-white p-7" : "bg-[#0b1b1e] p-7"} key={label}><p className={`text-5xl font-medium tracking-[-0.055em] ${provider ? "text-[#d83267]" : "text-[#ff8bb2]"}`}>{value}</p><p className={`mt-5 text-sm font-semibold ${provider ? "text-[#596568]" : "text-white/60"}`}>{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white" id="cara-kerja">
        <div className="mx-auto max-w-[1160px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-3xl"><p className="text-sm font-semibold text-[#d83267]">Cara kerja</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Dari langkah pertama sampai percakapan bisnis.</h2></div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#dfe3e3] bg-[#dfe3e3] md:grid-cols-4">
            {page.steps.map(([number, title, copy]) => <div className="bg-white p-6 lg:p-7" key={number}><p className="font-mono text-xs text-[#d83267]">{number}</p><h3 className="mt-12 text-xl font-medium leading-7">{title}</h3><p className="mt-4 text-sm leading-6 text-[#647073]">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7e4e5] bg-[#fbfaf9]">
        <div className="mx-auto grid max-w-[1160px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div><p className="text-sm font-semibold text-[#d83267]">Trust by design</p><h2 className="mt-4 text-4xl font-medium tracking-[-0.04em]">Koneksi baru dibuka saat konteksnya tepat.</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TrustPoint icon={ShieldCheck} title="Identitas terverifikasi" copy="Bukti perusahaan dan kelengkapan menjadi signal yang terlihat." />
            <TrustPoint icon={EyeOff} title="Kontak tetap privat" copy="Informasi pribadi tidak diberikan sebelum Introduction diterima." />
            <TrustPoint icon={Target} title="Matching transparan" copy="Alasan kecocokan dapat dipahami, bukan kotak hitam." />
            <TrustPoint icon={Users} title="Buyer memegang kontrol" copy="Perusahaan menentukan siapa yang boleh memulai percakapan." />
          </div>
        </div>
      </section>

      <section className="bg-[#d83267] text-white">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 lg:py-24">
          <h2 className="text-4xl font-medium tracking-[-0.04em] sm:text-6xl">{provider ? "Pipeline berikutnya dimulai dari kebutuhan nyata." : "Vendor berikutnya dipilih dengan konteks yang lebih jelas."}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">Buat akun gratis, pilih tujuan Anda, lalu lengkapi profil perusahaan.</p>
          <Link className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#071518] px-7 text-sm font-semibold text-white" href="/register">Mulai gratis <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </main>
    <MarketingFooter />
  </div>;
}

function ProviderPreview() {
  return <div className="relative rounded-[24px] border border-[#eadce1] bg-[#fff3f7] p-4 shadow-[0_30px_80px_rgba(73,25,42,0.12)] sm:p-6">
    <div className="rounded-2xl border border-[#e5dfe1] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-[#d83267]">MATCH UNTUK ANDA</p><h2 className="mt-2 text-xl font-medium">Warehouse Management System</h2><p className="mt-1 text-sm text-[#737e80]">Logistics · Surabaya</p></div><span className="rounded-full bg-[#fff1f5] px-3 py-1 text-sm font-semibold text-[#d83267]">94%</span></div><div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#e7e4e5] py-5"><MiniSignal icon={BarChart3} label="Buyer intent" value="92 / 100" /><MiniSignal icon={ShieldCheck} label="Verification" value="4 dari 5" /></div><div className="mt-5 flex flex-wrap gap-4 text-xs text-[#697477]"><span className="flex items-center gap-1"><MapPin className="size-3" />Surabaya</span><span className="flex items-center gap-1"><Clock3 className="size-3" />4–6 bulan</span></div></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#e8dfe2] bg-white p-4"><p className="text-xs text-[#7c8789]">Alasan kecocokan</p><p className="mt-2 text-sm font-medium leading-6">Pengalaman logistics dan teknologi utama sesuai.</p></div><div className="rounded-xl bg-[#071518] p-4 text-white"><p className="text-xs text-white/50">Next best action</p><p className="mt-2 text-sm font-medium leading-6">Tinjau konteks dan siapkan permintaan perkenalan.</p></div></div>
  </div>;
}

function BuyerPreview() {
  return <div className="rounded-[24px] bg-[#071518] p-4 text-white shadow-[0_30px_80px_rgba(7,21,24,0.2)] sm:p-6">
    <div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs text-white/45">Requirement builder</p><p className="mt-1 font-medium">Modernisasi operasional gudang</p></div><span className="flex items-center gap-1 rounded-full bg-[#17352d] px-3 py-1 text-xs font-semibold text-[#8ff0c2]"><Sparkles className="size-3" />Siap direview</span></div>
    <div className="mt-5 space-y-3">{[["Masalah bisnis", "Proses stok tersebar dan tidak real-time."], ["Hasil yang diharapkan", "Satu sistem operasional untuk empat gudang."], ["Budget & timeline", "Rp250–400 juta · 4–6 bulan"]].map(([label, value]) => <div className="rounded-xl border border-white/10 bg-white/5 p-4" key={label}><p className="text-xs text-white/45">{label}</p><p className="mt-2 text-sm leading-6">{value}</p></div>)}</div>
    <div className="mt-4 flex items-center justify-between rounded-xl bg-[#d83267] p-4"><div><p className="text-xs text-white/70">Hasil matching</p><p className="mt-1 font-medium">3 provider paling relevan</p></div><ArrowRight className="size-5" /></div>
  </div>;
}

function MiniSignal({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return <div><p className="flex items-center gap-1 text-xs text-[#7b8587]"><Icon className="size-3" />{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>;
}

function TrustPoint({ icon: Icon, title, copy }: { icon: typeof ShieldCheck; title: string; copy: string }) {
  return <div className="border-t border-[#dfe3e3] py-5"><Icon className="size-5 text-[#d83267]" /><h3 className="mt-5 font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-[#657174]">{copy}</p></div>;
}
