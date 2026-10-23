import { NextResponse } from "next/server";

export const jsonError = (message: string, status = 400, code = "bad_request") => {
  return NextResponse.json({ ok: false, error: { message, code } }, { status });
};

export const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

export class AppError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export const toErrorResponse = (error: unknown, fallback = "Что-то пошло не так. Попробуйте ещё раз.") => {
  if (error instanceof AppError) {
    return jsonError(error.message, error.status, error.code);
  }
  console.error("[magia] Unhandled API error", error);
  return jsonError(fallback, 500, "internal_error");
};

export const assertSameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  try {
    const originUrl = new URL(origin);
    if (host && originUrl.host !== host) {
      throw new AppError("Запрос отклонён", 403, "origin_mismatch");
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Некорректный источник запроса", 403, "origin_mismatch");
  }
};
