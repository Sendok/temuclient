"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const CONVERSATION_POLL_INTERVAL_MS = 10_000;

export function useConversationPolling(enabled = true) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => router.refresh(), CONVERSATION_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, router]);
}
