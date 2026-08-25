"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/site-shell";
import { Input } from "@/components/ui/primitives";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/modules/auth/schema";

type Mode = "login" | "register" | "forgot" | "reset";
type ApiError = { error?: { message?: string; fieldErrors?: Record<string, string[] | string> } };
type AuthFields = { name: string; email: string; password: string; token: string };

const schemas = { login: loginSchema, register: registerSchema, forgot: forgotPasswordSchema, reset: resetPasswordSchema };
const endpoint = { login: "/api/v1/auth/login", register: "/api/v1/auth/register", forgot: "/api/v1/auth/forgot-password", reset: "/api/v1/auth/reset-password" };

export function AuthPage({ mode, token = "" }: { mode: Mode; token?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const schema = schemas[mode];
  const form = useForm<AuthFields>({ resolver: zodResolver(schema as unknown as z.ZodType<AuthFields, AuthFields>), defaultValues: { name: "", email: "", password: "", token } });
  const copy = {
    login: ["Selamat datang kembali", "Masuk ke workspace TemuClient Anda."],
    register: ["Buat akun TemuClient", "Mulai dengan identitas kerja Anda."],
    forgot: ["Lupa password", "Kami akan menyiapkan tautan pemulihan bila email terdaftar."],
    reset: ["Atur password baru", "Gunakan password yang kuat dan unik."],
  }[mode];

  async function submit(values: AuthFields) {
    setError(""); setMessage("");
    const body = mode === "reset" ? { token, password: values.password } : values;
    const response = await fetch(endpoint[mode], { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as ApiError;
    if (!response.ok) { setError(payload.error?.message ?? "Permintaan belum dapat diproses."); return; }
    if (mode === "register") router.replace("/onboarding");
    else if (mode === "login") router.replace("/app");
    else if (mode === "reset") { setMessage("Password berhasil diperbarui. Silakan masuk."); setTimeout(() => router.replace("/login"), 900); }
    else setMessage("Jika email terdaftar, instruksi pemulihan telah dibuat.");
    router.refresh();
  }

  const isRegister = mode === "register";
  return <div className="marketing-theme min-h-screen bg-white text-[#071518]">
    <MarketingNav />
    <main className="grid min-h-[calc(100vh-74px)] lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-[#071518] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
        <div className="absolute -right-4 top-16 size-56 rounded-full border border-[#d83267]/40" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8bb2]">Verified B2B Opportunity Network</p>
          <h2 className="mt-7 max-w-xl text-5xl font-medium leading-[1.02] tracking-[-0.05em]">{isRegister ? <>Satu akun untuk menemukan <em className="font-normal text-[#ff8bb2]">koneksi yang tepat.</em></> : <>Kembali ke peluang yang <em className="font-normal text-[#ff8bb2]">layak dikejar.</em></>}</h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/60">{isRegister ? "Setelah mendaftar, pilih tujuan Anda: mencari client atau mencari vendor. Kami akan menyiapkan onboarding yang sesuai." : "Buka kembali opportunity, match, introduction, meeting, dan deal perusahaan Anda dalam satu alur."}</p>
        </div>
        <div className="relative mt-16 rounded-2xl border border-white/15 bg-white/[0.06] p-6">
          <div className="flex items-center justify-between"><p className="text-sm font-medium">Koneksi bisnis, dengan kontrol.</p><span className="flex items-center gap-1 rounded-full bg-[#17352d] px-3 py-1 text-xs font-semibold text-[#8ff0c2]"><ShieldCheck className="size-3" />Verified</span></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">{["Need", "Match", "Deal"].map((item, index) => <div className="border-t border-white/15 pt-4" key={item}><p className="font-mono text-xs text-[#ff8bb2]">0{index + 1}</p><p className="mt-3 text-sm font-medium">{item}</p></div>)}</div>
        </div>
      </aside>
      <section className="flex items-center justify-center bg-[radial-gradient(circle_at_70%_20%,#fff1f5_0%,#ffffff_45%)] px-5 py-12 sm:px-10 lg:py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d83267]">{isRegister ? "Mulai gratis" : mode === "login" ? "Selamat datang kembali" : "Keamanan akun"}</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">{copy[0]}</h1>
          <p className="mt-4 text-base leading-7 text-[#657174]">{copy[1]}</p>
          {isRegister && <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-[#eadfe3] bg-white p-4"><Sparkles className="size-4 text-[#d83267]" /><p className="mt-3 text-sm font-medium">Cari client</p><p className="mt-1 text-xs leading-5 text-[#788285]">Untuk penyedia jasa</p></div><div className="rounded-xl border border-[#eadfe3] bg-white p-4"><ShieldCheck className="size-4 text-[#d83267]" /><p className="mt-3 text-sm font-medium">Cari vendor</p><p className="mt-1 text-xs leading-5 text-[#788285]">Untuk pemilik proyek</p></div></div>}
          <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(submit)}>
            {mode === "register" && <Field error={form.formState.errors.name?.message?.toString()} label="Nama lengkap"><Input autoComplete="name" className="min-h-13 rounded-xl border-[#cfd3d3] px-4" placeholder="Nama Anda" {...form.register("name")} /></Field>}
            {mode !== "reset" && <Field error={form.formState.errors.email?.message?.toString()} label="Email kerja"><Input autoComplete="email" className="min-h-13 rounded-xl border-[#cfd3d3] px-4" placeholder="nama@perusahaan.co.id" type="email" {...form.register("email")} /></Field>}
            {(mode === "login" || mode === "register" || mode === "reset") && <Field error={form.formState.errors.password?.message?.toString()} label="Password"><Input autoComplete={mode === "login" ? "current-password" : "new-password"} className="min-h-13 rounded-xl border-[#cfd3d3] px-4" placeholder={mode === "login" ? "Masukkan password" : "Minimal 8 karakter"} type="password" {...form.register("password")} />{mode !== "login" && <span className="mt-2 flex items-center gap-1.5 text-xs text-[#7c8789]"><Check className="size-3" />Gunakan huruf besar, huruf kecil, dan angka.</span>}</Field>}
            {error && <p className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">{error}</p>}
            {message && <p className="rounded-xl border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700" role="status">{message}</p>}
            <Button className="min-h-13 w-full rounded-full bg-[#071518] text-sm font-semibold hover:bg-[#d83267]" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Memproses…" : mode === "login" ? "Masuk ke workspace" : mode === "register" ? <>Buat akun gratis <ArrowRight className="size-4" /></> : mode === "forgot" ? "Kirim instruksi" : "Simpan password"}</Button>
          </form>
          <div className="mt-7 text-sm text-[#657174]">{mode === "login" ? <><div className="flex items-center justify-between gap-4"><Link className="font-semibold text-[#ad204f]" href="/forgot-password">Lupa password?</Link><p>Belum punya akun? <Link className="font-semibold text-[#ad204f]" href="/register">Daftar</Link></p></div><p className="mt-6 border-t border-[#e7e4e5] pt-5 text-xs text-[#7d888a]">Tim internal TemuClient? <Link className="font-semibold text-[#ad204f]" href="/admin/login">Masuk sebagai admin</Link></p></> : mode === "register" ? <p className="text-center">Sudah punya akun? <Link className="font-semibold text-[#ad204f]" href="/login">Masuk</Link></p> : <Link className="inline-flex items-center gap-2 font-semibold text-[#ad204f]" href="/login"><ArrowLeft className="size-4" />Kembali ke login</Link>}</div>
          {isRegister && <p className="mt-6 text-center text-xs leading-5 text-[#8a9395]">Dengan mendaftar, Anda menyetujui penggunaan TemuClient untuk koneksi bisnis yang sah dan terverifikasi.</p>}
        </div>
      </section>
    </main>
  </div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span>{children}{error && <span className="mt-1 block text-xs text-danger-700">{error}</span>}</label>;
}
