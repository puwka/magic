import { getAppConfig } from "@/lib/config";
import { toErrorResponse, AppError } from "@/lib/http";
import { noStoreJson } from "@/lib/api/guard";
import { safeSecretEqual } from "@/lib/security/rate-limit";
import { processGenerationJobs } from "@/lib/generation/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const authorize = (request: Request) => {
  const config = getAppConfig();
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (!config.cronSecret || !safeSecretEqual(provided, config.cronSecret)) {
    throw new AppError("Доступ запрещён.", 403, "cron_forbidden");
  }
};

export const GET = async (request: Request) => {
  try {
    authorize(request);
    const result = await processGenerationJobs(2);
    return noStoreJson({ ok: true, result });
  } catch (error) {
    return toErrorResponse(error, "Не удалось запустить обработчик.");
  }
};

export const POST = GET;
