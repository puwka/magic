import { z } from "zod";
import { assertSameOrigin, toErrorResponse } from "@/lib/http";
import { enforceRateLimit, noStoreJson, readJsonBody } from "@/lib/api/guard";
import { findOrderForRecovery } from "@/lib/orders/service";
import { sendOrderCreatedEmail } from "@/lib/email/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recoverSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^MG-\d{4}-[A-F0-9]{6}$/, "Проверьте номер заказа"),
  email: z.string().trim().toLowerCase().email("Проверьте адрес почты").max(120),
});

const genericMessage =
  "Если заказ с таким номером и почтой найден, мы отправили на этот адрес личную ссылку. Проверьте папку «Спам».";

export const POST = async (request: Request) => {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "orders:recover", 6, 15 * 60 * 1000);

    const body = await readJsonBody(request);
    const parsed = recoverSchema.safeParse(body);
    if (!parsed.success) {
      return noStoreJson({ ok: true, message: genericMessage });
    }

    const order = await findOrderForRecovery(parsed.data.orderNumber, parsed.data.email);
    if (!order) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return noStoreJson({ ok: true, message: genericMessage });
    }

    try {
      await sendOrderCreatedEmail(order);
    } catch (error) {
      console.error("[magia] Recovery email failed", error);
    }

    return noStoreJson({ ok: true, message: genericMessage });
  } catch (error) {
    return toErrorResponse(error, "Не удалось отправить письмо. Попробуйте позже.");
  }
};
