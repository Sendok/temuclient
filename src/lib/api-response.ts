import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DomainError } from "@/lib/errors/domain-error";
import { getErrorTracker } from "@/lib/observability/error-tracking";

type ZodIssueLike = { message: string; path: PropertyKey[] };

function getZodIssues(error: unknown): ZodIssueLike[] | null {
  if (error instanceof ZodError) return error.issues;
  if (!error || typeof error !== "object") return null;

  // Next.js standalone bundles can contain separate Zod module instances,
  // making instanceof unreliable across the route and response boundaries.
  const candidate = error as { name?: unknown; issues?: unknown };
  if ((candidate.name !== "ZodError" && candidate.name !== "$ZodError") || !Array.isArray(candidate.issues)) return null;
  return candidate.issues.every((issue): issue is ZodIssueLike =>
    Boolean(issue)
    && typeof issue === "object"
    && Array.isArray((issue as ZodIssueLike).path)
    && typeof (issue as ZodIssueLike).message === "string")
    ? candidate.issues
    : null;
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, meta: {} }, init);
}

export function apiList<T>(data: T[], meta: Record<string, unknown>) {
  return NextResponse.json({ data, meta });
}

export function apiError(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors ?? {} } },
      { status: error.status },
    );
  }

  const zodIssues = getZodIssues(error);
  if (zodIssues) {
    const fieldErrors = Object.fromEntries(
      zodIssues.map((issue) => [issue.path.map(String).join("."), issue.message]),
    );
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Periksa kembali data yang Anda masukkan.", fieldErrors } },
      { status: 400 },
    );
  }

  console.error("Unhandled API error", error instanceof Error ? error.message : "Unknown error");
  void getErrorTracker().capture(error, { layer: "api" });
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Terjadi kendala pada server.", fieldErrors: {} } },
    { status: 500 },
  );
}
