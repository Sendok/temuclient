"use client";

import { ErrorState } from "@/components/ui/primitives";

export default function AppError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl p-6"><ErrorState title="Workspace tidak dapat dimuat" description="Terjadi kendala saat memuat workspace. Data sensitif dan detail internal tidak ditampilkan."/><button className="mt-4 min-h-11 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white" onClick={reset}>Muat ulang</button></main>;
}
