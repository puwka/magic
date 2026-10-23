import { getAppConfig, isTestPaymentAllowed } from "@/lib/config";
import { assertSameOrigin, toErrorResponse } from "@/lib/http";
import { enforceRateLimit, getOrderToken, noStoreJson } from "@/lib/api/guard";
import { deleteOrderData, requireOrder, syncOrderPayment } from "@/lib/orders/service";
import { toPublicOrder } from "@/lib/orders/public";
import { scheduleInlineGeneration } from "@/lib/generation/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = async (request: Request, context: RouteContext) => {
  try {
    enforceRateLimit(request, "orders:read", 240, 60 * 1000);
    const { id } = await context.params;
    const token = getOrderToken(request);
    let order = await requireOrder(id, token);

    const forceSync = new URL(request.url).searchParams.get("sync") === "1";
    order = await syncOrderPayment(order, forceSync);

    if (order.status === "paid" || order.status === "generating") {
      scheduleInlineGeneration();
    }

    const config = getAppConfig();
    return noStoreJson({
      ok: true,
      order: toPublicOrder(order, config.generationMaxAttempts, {
        testPaymentEnabled: isTestPaymentAllowed(config),
      }),
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось загрузить заказ.");
  }
};

export const DELETE = async (request: Request, context: RouteContext) => {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "orders:delete", 10, 60 * 60 * 1000);
    const { id } = await context.params;
    const token = getOrderToken(request);
    const order = await deleteOrderData(id, token);
    return noStoreJson({
      ok: true,
      deleted: Boolean(order.dataDeletedAt),
      message: "Персональные данные удалены. Личная ссылка больше не действует.",
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось удалить данные заказа.");
  }
};
