import { getAppConfig, isTestPaymentAllowed } from "@/lib/config";
import { assertSameOrigin, toErrorResponse } from "@/lib/http";
import { enforceRateLimit, getOrderToken, noStoreJson } from "@/lib/api/guard";
import { confirmTestPayment } from "@/lib/orders/service";
import { toPublicOrder } from "@/lib/orders/public";
import { scheduleInlineGeneration } from "@/lib/generation/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = async (request: Request, context: RouteContext) => {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "orders:test-pay", 12, 10 * 60 * 1000);
    const { id } = await context.params;
    const order = await confirmTestPayment(id, getOrderToken(request));
    scheduleInlineGeneration();

    const config = getAppConfig();
    return noStoreJson({
      ok: true,
      testPayment: isTestPaymentAllowed(config),
      order: toPublicOrder(order, config.generationMaxAttempts, {
        testPaymentEnabled: isTestPaymentAllowed(config),
      }),
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось подтвердить тестовую оплату.");
  }
};
