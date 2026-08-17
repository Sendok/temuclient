"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { TemuClientLogo } from "@/components/brand/temuclient-logo";
import { Card, Input } from "@/components/ui/primitives";
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

  return <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]">
    <section className="flex items-center justify-center px-5 py-10 sm:px-10">
      <div className="w-full max-w-md">
        <Link aria-label="TemuClient — Beranda" className="mb-10 inline-flex" href="/"><TemuClientLogo /></Link>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">{copy[0]}</h1><p className="mt-2 text-sm leading-6 text-text-secondary">{copy[1]}</p>
        <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(submit)}>
          {mode === "register" && <Field error={form.formState.errors.name?.message?.toString()} label="Nama lengkap"><Input autoComplete="name" {...form.register("name")} /></Field>}
          {mode !== "reset" && <Field error={form.formState.errors.email?.message?.toString()} label="Email kerja"><Input autoComplete="email" type="email" {...form.register("email")} /></Field>}
          {(mode === "login" || mode === "register" || mode === "reset") && <Field error={form.formState.errors.password?.message?.toString()} label="Password"><Input autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" {...form.register("password")} /></Field>}
          {error && <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{error}</p>}
          {message && <p className="rounded-md border border-success-100 bg-success-50 px-3 py-2 text-sm text-success-700" role="status">{message}</p>}
          <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Memproses…" : mode === "login" ? "Masuk" : mode === "register" ? "Buat akun" : mode === "forgot" ? "Kirim instruksi" : "Simpan password"}</Button>
        </form>
        <div className="mt-6 text-sm text-text-secondary">{mode === "login" ? <><Link className="font-medium text-brand-700" href="/forgot-password">Lupa password?</Link><p className="mt-4">Belum punya akun? <Link className="font-semibold text-brand-700" href="/register">Daftar</Link></p><p className="mt-4 border-t pt-4 text-xs text-text-muted">Tim internal TemuClient? <Link className="font-semibold text-brand-700" href="/admin/login">Masuk sebagai admin</Link></p></> : mode === "register" ? <p>Sudah punya akun? <Link className="font-semibold text-brand-700" href="/login">Masuk</Link></p> : <Link className="inline-flex items-center gap-2 font-semibold text-brand-700" href="/login"><ArrowLeft className="size-4" />Kembali ke login</Link>}</div>
      </div>
    </section>
    <aside className="hidden items-center justify-center border-l bg-text-primary p-12 text-white lg:flex"><Card className="max-w-lg border-white/10 bg-white/5 p-10"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">Verified B2B Opportunity Network</p><p className="mt-5 text-3xl font-semibold leading-tight">Need → Qualification → Match → Introduction → Meeting → Deal</p><p className="mt-5 text-sm leading-7 text-gray-300">Satu workspace yang tenang dan terstruktur untuk membangun hubungan bisnis yang kredibel.</p></Card></aside>
  </main>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span>{children}{error && <span className="mt-1 block text-xs text-danger-700">{error}</span>}</label>;
}
