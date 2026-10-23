import type { GenerationResult, GenerationStep } from "@/lib/generation/types";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "generating"
  | "completed"
  | "failed"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type GenerationStatus = "idle" | "queued" | "running" | "completed" | "failed";

export interface StoredOrderInput {
  childName: string;
  childAge: number;
  interests: string[];
  extraDetails: string;
  theme: string;
  mood: string;
  wish: string;
  email: string;
  consentVersion: string;
}

export interface OrderGenerationState {
  status: GenerationStatus;
  step: GenerationStep;
  progress: number;
  attempts: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  leaseUntil: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  accessTokenHash: string;
  accessTokenCiphertext: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  input: StoredOrderInput;
  email: string;
  priceRub: number;
  currency: "RUB";
  isDemo: boolean;
  checkoutUrl: string | null;
  paymentProvider: string | null;
  paymentId: string | null;
  generation: OrderGenerationState;
  result: GenerationResult | null;
  pdfStorageKey: string | null;
  emailSentAt: string | null;
  emailError: string | null;
  dataDeletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  completedAt: string | null;
  refundedAt: string | null;
}

export type PaymentRecord = {
  id: string;
  orderId: string;
  provider: "test" | "yookassa";
  providerPaymentId: string;
  amount: number;
  currency: "RUB";
  status: PaymentStatus;
  confirmationUrl: string | null;
  idempotenceKey: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  failureReason: string | null;
  metadata: Record<string, string | number | boolean | null>;
};

export interface OrderRepository {
  createOrder(order: Order): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  updateOrder(id: string, updater: (order: Order) => Order): Promise<Order | null>;
  listGenerationCandidates(nowIso: string, limit: number): Promise<Order[]>;
  claimGeneration(id: string, leaseUntilIso: string): Promise<Order | null>;
  createPayment(payment: PaymentRecord): Promise<PaymentRecord>;
  getPaymentByProvider(provider: string, providerPaymentId: string): Promise<PaymentRecord | null>;
  updatePayment(id: string, updater: (payment: PaymentRecord) => PaymentRecord): Promise<PaymentRecord | null>;
  clearOrderData(order: Order): Promise<Order>;
}

export const publicStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "Ожидает оплаты",
  paid: "Оплачен",
  generating: "Создаём сказку",
  completed: "Готово",
  failed: "Нужна повторная попытка",
  refunded: "Возврат",
};

export const progressForStep = (step: GenerationStep) => {
  const positions: Record<GenerationStep, number> = {
    queued: 4,
    story: 22,
    cover: 48,
    illustrations: 68,
    pdf: 90,
    email: 96,
  };
  return positions[step] ?? 0;
};
