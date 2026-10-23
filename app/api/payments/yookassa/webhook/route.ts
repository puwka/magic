import { z } from "zod";
import { toErrorResponse } from "@/lib/http";
import { noStoreJson, readJsonBody } from "@/lib/api/guard";
import { getOrderRepository } from "@/lib/orders/repository";
import { confirmPayment } from "@/lib/orders/service";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSchema = z.object({
  event: z.string().min(3).max(60),
  object: z
    .object({
      id: z.string().min(1).max(120),
      status: z.string().max(40).optional(),
      paid: z.boolean().optional(),
    })
    .passthrough(),
});

export const POST = async (request: Request) => {
  try {
    const body = await readJsonBody(request, 65_536);
    const parsed = webhookSchema.safeParse(body);
    if (!parsed.success) return noStoreJson({ ok: true, ignored: "invalid_payload" });

    const { event, object } = parsed.data;
    if (event !== "payment.succeeded" && event !== "payment.canceled") {
      return noStoreJson({ ok: true, ignored: "event" });
    }

    const provider = getPaymentProvider();
    if (provider.id !== "yookassa") {
      return noStoreJson({ ok: true, ignored: "provider" });
    }

    const repository = getOrderRepository();
    const payment = await repository.getPaymentByProvider("yookassa", object.id);
    if (!payment) return noStoreJson({ ok: true, ignored: "unknown_payment" });

    const state = await provider.getPayment(object.id);
    if (state.orderId && state.orderId !== payment.orderId) {
      console.error("[magia] YooKassa webhook order metadata mismatch");
      return noStoreJson({ ok: true, ignored: "metadata_mismatch" });
    }

    if (state.status === "succeeded") {
      if (state.amount !== payment.amount || state.currency !== payment.currency) {
        console.error("[magia] YooKassa webhook amount mismatch");
        return noStoreJson({ ok: true, ignored: "amount_mismatch" });
      }
      await confirmPayment({
        provider: "yookassa",
        providerPaymentId: object.id,
        amount: state.amount,
        currency: state.currency,
      });
      return noStoreJson({ ok: true, accepted: "paid" });
    }

    if (state.status === "canceled" || state.status === "failed") {
      await repository.updatePayment(payment.id, (current) =>
        current.status === "pending"
          ? { ...current, status: "failed", failureReason: "Платёж отменён или не прошёл." }
          : current,
      );
      await repository.updateOrder(payment.orderId, (current) =>
        current.paymentStatus === "pending" ? { ...current, paymentStatus: "failed" } : current,
      );
      return noStoreJson({ ok: true, accepted: "failed" });
    }

    return noStoreJson({ ok: true, ignored: "pending" });
  } catch (error) {
    return toErrorResponse(error, "Не удалось обработать уведомление.");
  }
};
