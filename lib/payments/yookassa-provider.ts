import type { CreatedPayment, PaymentProvider, ProviderPaymentState } from "@/lib/payments/types";
import type { Order } from "@/lib/orders/types";

type YooKassaPayment = {
  id: string;
  status: string;
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type?: string; confirmation_url?: string };
  metadata?: { orderId?: string };
};

const parseAmount = (value: string) => Math.round(Number.parseFloat(value));

export class YooKassaPaymentProvider implements PaymentProvider {
  readonly id = "yookassa" as const;
  private readonly shopId: string;
  private readonly secretKey: string;
  private readonly returnUrl: string;

  constructor(options: { shopId: string; secretKey: string; returnUrl: string }) {
    this.shopId = options.shopId;
    this.secretKey = options.secretKey;
    this.returnUrl = options.returnUrl;
  }

  private authHeader() {
    return "Basic " + Buffer.from(this.shopId + ":" + this.secretKey, "utf8").toString("base64");
  }

  async createPayment(order: Order, idempotenceKey: string): Promise<CreatedPayment> {
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Idempotence-Key": idempotenceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { value: order.priceRub.toFixed(2), currency: "RUB" },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: this.returnUrl || "",
        },
        description: "Персональная сказка «Магия» — заказ " + order.orderNumber,
        metadata: { orderId: order.id },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const data = (await response.json()) as YooKassaPayment & { description?: string };
    if (!response.ok || !data.confirmation?.confirmation_url) {
      throw new Error("YooKassa payment creation failed: " + response.status);
    }

    return {
      provider: "yookassa",
      providerPaymentId: data.id,
      confirmationUrl: data.confirmation.confirmation_url,
      amount: order.priceRub,
      currency: "RUB",
    };
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPaymentState> {
    const response = await fetch("https://api.yookassa.ru/v3/payments/" + encodeURIComponent(providerPaymentId), {
      headers: { Authorization: this.authHeader() },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const data = (await response.json()) as YooKassaPayment;
    if (!response.ok) throw new Error("YooKassa payment lookup failed: " + response.status);

    const status = data.status === "succeeded" && data.paid ? "succeeded" : data.status === "canceled" ? "canceled" : "pending";
    return {
      providerPaymentId: data.id,
      status,
      amount: parseAmount(data.amount.value),
      currency: data.amount.currency === "RUB" ? "RUB" : "RUB",
      confirmationUrl: data.confirmation?.confirmation_url ?? null,
      orderId: data.metadata?.orderId ?? null,
      rawStatus: data.status,
    };
  }
}
