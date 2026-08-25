"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TemuClientLogo } from "@/components/brand/temuclient-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
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
  return <main className="grid min-h-screen bg-white text-[#071518] lg:grid-cols-[0.95fr_1.05fr]">
    <section className="flex items-center justify-center bg-[radial-gradient(circle_at_35%_15%,#fff1f5_0%,#ffffff_42%)] px-5 py-10 sm:px-10">
      <div className="w-full max-w-md">
        <Link aria-label="TemuClient — Beranda" className="mb-12 inline-flex" href="/"><TemuClientLogo /></Link>
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#fff1f5] text-[#d83267]"><LockKeyhole className="size-5" /></div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#d83267]">Platform Operations</p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Masuk sebagai admin</h1>
        <p className="mt-4 text-sm leading-7 text-[#657174]">Ruang khusus tim internal untuk verification, moderation, dan audit platform.</p>
        <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(submit)}>
          <label className="block"><span className="mb-2 block text-sm font-medium">Email admin</span><Input autoComplete="username" className="min-h-13 rounded-xl border-[#cfd3d3] px-4" placeholder="admin@temuclient.com" type="email" {...form.register("email")} />{form.formState.errors.email && <span className="mt-1 block text-xs text-danger-700">{form.formState.errors.email.message}</span>}</label>
          <label className="block"><span className="mb-2 block text-sm font-medium">Password</span><Input autoComplete="current-password" className="min-h-13 rounded-xl border-[#cfd3d3] px-4" placeholder="Masukkan password" type="password" {...form.register("password")} />{form.formState.errors.password && <span className="mt-1 block text-xs text-danger-700">{form.formState.errors.password.message}</span>}</label>
          {error && <p className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">{error}</p>}
          <Button className="min-h-13 w-full rounded-full bg-[#071518] font-semibold hover:bg-[#d83267]" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Memeriksa akses…" : <>Masuk ke Admin Console <ArrowRight className="size-4" /></>}</Button>
        </form>
        <Link className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#ad204f]" href="/login"><ArrowLeft className="size-4" />Masuk sebagai pengguna biasa</Link>
      </div>
    </section>
    <aside className="relative hidden overflow-hidden bg-[#071518] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/10" /><div className="absolute -right-4 top-16 size-56 rounded-full border border-[#d83267]/45" />
      <div className="relative"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8bb2]">Admin TemuClient</p><h2 className="mt-7 max-w-xl text-5xl font-medium leading-[1.02] tracking-[-0.05em]">Jaga kualitas jaringan dari <em className="font-normal text-[#ff8bb2]">satu ruang tepercaya.</em></h2><p className="mt-6 max-w-lg text-base leading-7 text-white/60">Admin terpisah dari onboarding pencari vendor dan penyedia jasa. Setiap tindakan penting dicatat dalam audit trail.</p></div>
      <div className="relative mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 sm:grid-cols-3">{[[ShieldCheck,"Verification"],[FileCheck2,"Moderation"],[LockKeyhole,"Audit trail"]].map(([Icon,label]) => { const ItemIcon = Icon; return <div className="bg-[#0b1b1e] p-5" key={label as string}><ItemIcon className="size-5 text-[#ff8bb2]" /><p className="mt-8 text-sm font-medium">{label as string}</p></div>; })}</div>
    </aside>
  </main>;
}
