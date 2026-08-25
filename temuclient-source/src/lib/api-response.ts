import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DomainError } from "@/lib/errors/domain-error";
import { getErrorTracker } from "@/lib/observability/error-tracking";

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

  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join("."), issue.message]),
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
