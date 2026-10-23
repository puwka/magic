import { getAppConfig, isTestPaymentAllowed } from "@/lib/config";
import { assertSameOrigin, toErrorResponse } from "@/lib/http";
import { enforceRateLimit, getOrderToken, noStoreJson } from "@/lib/api/guard";
import { resetFailedOrderForRetry } from "@/lib/orders/service";
import { toPublicOrder } from "@/lib/orders/public";
import { scheduleInlineGeneration } from "@/lib/generation/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = async (request: Request, context: RouteContext) => {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "orders:retry", 10, 10 * 60 * 1000);
    const { id } = await context.params;
    const order = await resetFailedOrderForRetry(id, getOrderToken(request));
    scheduleInlineGeneration();

    const config = getAppConfig();
    return noStoreJson({
      ok: true,
      order: toPublicOrder(order, config.generationMaxAttempts, {
        testPaymentEnabled: isTestPaymentAllowed(config),
      }),
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось запустить повторную генерацию.");
  }
};
