import { randomUUID } from "node:crypto";
import type { CreatedPayment, PaymentProvider, ProviderPaymentState } from "@/lib/payments/types";
import type { Order } from "@/lib/orders/types";
import { getAppConfig, isTestPaymentAllowed } from "@/lib/config";

export class TestPaymentProvider implements PaymentProvider {
  readonly id = "test" as const;

  async createPayment(order: Order): Promise<CreatedPayment> {
    const config = getAppConfig();
    if (!isTestPaymentAllowed(config)) {
      throw new Error("Test payments are disabled in this environment.");
    }
    return {
      provider: "test",
      providerPaymentId: "test_" + randomUUID(),
      confirmationUrl: "/pay/" + order.id,
      amount: order.priceRub,
      currency: order.currency,
    };
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPaymentState> {
    return {
      providerPaymentId,
      status: "pending",
      amount: 0,
      currency: "RUB",
      confirmationUrl: null,
      orderId: null,
      rawStatus: "test_pending",
    };
  }
}
