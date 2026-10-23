import { AppError } from "@/lib/http";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const getOrderToken = (request: Request): string | null => {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken.slice(0, 300);
  const headerToken = request.headers.get("x-order-token");
  if (headerToken) return headerToken.slice(0, 300);
  return null;
};

export const enforceRateLimit = (
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
) => {
  const ip = getClientIp(request);
  const result = checkRateLimit(scope + ":" + ip, limit, windowMs);
  if (!result.allowed) {
    throw new AppError(
      "Слишком много запросов. Подождите " + result.retryAfterSeconds + " сек. и попробуйте ещё раз.",
      429,
      "rate_limited",
    );
  }
};

export const readJsonBody = async (request: Request, maxBytes = 16_384): Promise<unknown> => {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new AppError("Запрос слишком большой.", 413, "payload_too_large");
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    throw new AppError("Запрос слишком большой.", 413, "payload_too_large");
  }
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new AppError("Некорректный формат запроса.", 400, "invalid_json");
  }
};

export const noStoreJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
