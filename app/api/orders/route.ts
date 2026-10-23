import { z } from "zod";
import { assertSameOrigin, AppError, toErrorResponse } from "@/lib/http";
import { createOrder } from "@/lib/orders/service";
import { createOrderRequestSchema } from "@/lib/validation/order";
import { enforceRateLimit, noStoreJson, readJsonBody } from "@/lib/api/guard";
import { sendOrderCreatedEmail } from "@/lib/email/notifications";
import { getOrderRepository } from "@/lib/orders/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const honeypotSchema = z.object({ company: z.string().max(0) }).passthrough();

export const POST = async (request: Request) => {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "orders:create", 6, 10 * 60 * 1000);

    const body = await readJsonBody(request);
    const honeypot = honeypotSchema.safeParse(body);
    if (!honeypot.success) {
      throw new AppError("Не удалось отправить заказ. Обновите страницу и попробуйте снова.", 400, "spam_detected");
    }

    const parsed = createOrderRequestSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw new AppError(first?.message ?? "Проверьте данные заказа.", 422, "validation_error");
    }

    const created = await createOrder(parsed.data);

    try {
      await sendOrderCreatedEmail(created.order);
    } catch (error) {
      console.error("[magia] Could not send order created email", error);
    }

    const fresh = await getOrderRepository().getOrder(created.order.id);

    return noStoreJson({
      ok: true,
      order: {
        id: created.order.id,
        orderNumber: created.order.orderNumber,
        status: created.order.status,
        paymentStatus: created.order.paymentStatus,
        isDemo: created.order.isDemo,
        priceRub: created.order.priceRub,
        currency: created.order.currency,
        checkoutUrl: created.checkoutUrl,
        emailSent: Boolean(fresh?.emailSentAt),
        emailError: fresh?.emailError ?? null,
      },
      accessToken: created.token,
      orderLink: created.orderLink,
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось создать заказ. Попробуйте ещё раз.");
  }
};
