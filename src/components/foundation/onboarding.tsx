"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/modules/organizations/schema";

export function RoleOnboarding({ name }: { name: string }) {
  const router = useRouter();
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12"><div className="w-full max-w-4xl"><p className="text-sm font-semibold text-brand-700">Selamat datang, {name}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Apa yang ingin perusahaan Anda capai?</h1><p className="mt-2 text-text-secondary">Pilihan ini menentukan workspace dan aturan akses organisasi.</p><div className="mt-8 grid gap-4 md:grid-cols-2"><Choice icon={Search} title="Cari Client" description="Untuk software house, konsultan, agency, dan provider B2B yang mencari peluang terverifikasi." onClick={() => router.push("/onboarding/provider/company")} /><Choice icon={Building2} title="Cari Vendor" description="Untuk perusahaan yang ingin menjelaskan kebutuhan dan menemukan provider yang tepat." onClick={() => router.push("/onboarding/buyer/company")} /></div></div></main>;
}

function Choice({ icon: Icon, title, description, onClick }: { icon: typeof Search; title: string; description: string; onClick: () => void }) {
  return <button className="group text-left" onClick={onClick}><Card className="h-full p-7 transition hover:border-brand-300 hover:shadow-lg"><span className="flex size-11 items-center justify-center rounded-md bg-brand-50 text-brand-700"><Icon className="size-5" /></span><h2 className="mt-6 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">Lanjutkan <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></Card></button>;
}

export function OrganizationOnboarding({ type }: { type: "BUYER" | "PROVIDER" }) {
  const router = useRouter(); const [error, setError] = useState("");
  const form = useForm<CreateOrganizationInput>({ resolver: zodResolver(createOrganizationSchema), defaultValues: { name: "", type, website: "", city: "Jakarta", description: "", businessEmail: "" } });
  async function submit(values: CreateOrganizationInput) { setError(""); const response = await fetch("/api/v1/organizations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) }); const payload = await response.json(); if (!response.ok) { setError(payload.error?.message ?? "Organisasi belum dapat dibuat."); return; } router.replace(type === "PROVIDER" ? "/onboarding/provider/services" : "/app"); router.refresh(); }
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10"><Card className="w-full max-w-2xl p-6 sm:p-9"><p className="text-xs font-semibold uppercase tracking-widest text-brand-700">{type === "PROVIDER" ? "Workspace Provider" : "Workspace Buyer"}</p><h1 className="mt-2 text-2xl font-semibold">Lengkapi profil perusahaan</h1><p className="mt-2 text-sm text-text-secondary">Informasi dasar ini dapat diperbarui dari pengaturan perusahaan.</p><form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}><Field label="Nama perusahaan" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field><Field label="Kota" error={form.formState.errors.city?.message}><Input {...form.register("city")} /></Field><Field label="Website" error={form.formState.errors.website?.message}><Input placeholder="https://" {...form.register("website")} /></Field><Field label="Email bisnis" error={form.formState.errors.businessEmail?.message}><Input type="email" {...form.register("businessEmail")} /></Field><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Tentang perusahaan</span><textarea className="min-h-32 w-full rounded-md border bg-surface p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" {...form.register("description")} />{form.formState.errors.description?.message && <span className="mt-1 block text-xs text-danger-700">{form.formState.errors.description.message}</span>}</label>{error && <p className="sm:col-span-2 text-sm text-danger-700" role="alert">{error}</p>}<div className="sm:col-span-2"><Button disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Membuat workspace…" : "Buat workspace"}</Button></div></form></Card></main>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label><span className="mb-2 block text-sm font-medium">{label}</span>{children}{error && <span className="mt-1 block text-xs text-danger-700">{error}</span>}</label>; }
