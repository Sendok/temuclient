"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TemuClientLogo } from "@/components/brand/temuclient-logo";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";
import { loginSchema, type LoginInput } from "@/modules/auth/schema";

export function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  async function submit(values: LoginInput) {
    setError("");
    const response = await fetch("/api/v1/auth/admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error?.message ?? "Akses admin belum dapat diproses."); return; }
    router.replace("/admin"); router.refresh();
  }
  return <main className="grid min-h-screen bg-background lg:grid-cols-[1fr_1.05fr]"><section className="flex items-center justify-center px-5 py-10 sm:px-10"><div className="w-full max-w-md"><Link aria-label="TemuClient — Beranda" className="mb-10 inline-flex" href="/"><TemuClientLogo /></Link><div className="mb-6 flex size-11 items-center justify-center rounded-md bg-brand-50 text-brand-700"><ShieldCheck className="size-5" /></div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Platform Operations</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Masuk sebagai admin</h1><p className="mt-2 text-sm leading-6 text-text-secondary">Khusus tim internal TemuClient. Akun penyedia jasa dan pencari vendor masuk melalui halaman pengguna biasa.</p><form className="mt-8 space-y-5" onSubmit={form.handleSubmit(submit)}><label className="block"><span className="mb-2 block text-sm font-medium">Email admin</span><Input autoComplete="username" type="email" {...form.register("email")} />{form.formState.errors.email && <span className="mt-1 block text-xs text-danger-700">{form.formState.errors.email.message}</span>}</label><label className="block"><span className="mb-2 block text-sm font-medium">Password</span><Input autoComplete="current-password" type="password" {...form.register("password")} />{form.formState.errors.password && <span className="mt-1 block text-xs text-danger-700">{form.formState.errors.password.message}</span>}</label>{error && <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700" role="alert">{error}</p>}<Button className="w-full" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Memeriksa akses…" : "Masuk ke Admin Console"}</Button></form><Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700" href="/login"><ArrowLeft className="size-4" />Masuk sebagai pengguna biasa</Link></div></section><aside className="hidden items-center justify-center border-l bg-text-primary p-12 text-white lg:flex"><Card className="max-w-lg border-white/10 bg-white/5 p-10"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">Admin TemuClient</p><p className="mt-5 text-3xl font-semibold leading-tight">Verifikasi, moderasi, dan audit dalam ruang terpisah.</p><p className="mt-5 text-sm leading-7 text-gray-300">Admin tidak membuat organisasi, memilih peran perusahaan, atau mengikuti onboarding penyedia jasa dan pencari vendor.</p></Card></aside></main>;
}
