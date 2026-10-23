import type { Order } from "@/lib/orders/types";

export type ProviderPaymentState = {
  providerPaymentId: string;
  status: "pending" | "succeeded" | "canceled" | "failed";
  amount: number;
  currency: "RUB";
  confirmationUrl: string | null;
  orderId: string | null;
  rawStatus: string;
};

export type CreatedPayment = {
  provider: "test" | "yookassa";
  providerPaymentId: string;
  confirmationUrl: string;
  amount: number;
  currency: "RUB";
};

export interface PaymentProvider {
  readonly id: "test" | "yookassa";
  createPayment(order: Order, idempotenceKey: string): Promise<CreatedPayment>;
  getPayment(providerPaymentId: string): Promise<ProviderPaymentState>;
}
