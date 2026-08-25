"use client";

import { ErrorState } from "@/components/ui/primitives";

export default function AdminError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl p-6"><ErrorState title="Admin Console tidak dapat dimuat" description="Detail internal tidak ditampilkan. Periksa koneksi lalu coba kembali." /><button className="mt-4 min-h-11 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white" onClick={reset}>Muat ulang</button></main>;
}
