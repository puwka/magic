import { getAppConfig, isTestPaymentAllowed } from "@/lib/config";
import { assertSameOrigin, toErrorResponse } from "@/lib/http";
import { enforceRateLimit, getOrderToken, noStoreJson } from "@/lib/api/guard";
import { createReplacementPayment } from "@/lib/orders/service";
import { toPublicOrder } from "@/lib/orders/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = async (request: Request, context: RouteContext) => {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "orders:new-payment", 6, 30 * 60 * 1000);
    const { id } = await context.params;
    const order = await createReplacementPayment(id, getOrderToken(request));
    const config = getAppConfig();
    return noStoreJson({
      ok: true,
      order: toPublicOrder(order, config.generationMaxAttempts, {
        testPaymentEnabled: isTestPaymentAllowed(config),
      }),
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось создать новую попытку оплаты.");
  }
};
