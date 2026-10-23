import type { Order, OrderRepository, PaymentRecord } from "@/lib/orders/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type OrderRow = Record<string, unknown>;
type PaymentRow = Record<string, unknown>;

const toIso = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return new Date(value as string | number).toISOString();
};

const orderFromRow = (row: OrderRow): Order => ({
  id: String(row.id),
  orderNumber: String(row.order_number),
  accessTokenHash: String(row.access_token_hash),
  accessTokenCiphertext: String(row.access_token_ciphertext),
  status: row.status as Order["status"],
  paymentStatus: row.payment_status as Order["paymentStatus"],
  input: row.input as Order["input"],
  email: String(row.email),
  priceRub: Number(row.price_rub),
  currency: "RUB",
  isDemo: Boolean(row.is_demo),
  checkoutUrl: (row.checkout_url as string | null) ?? null,
  paymentProvider: (row.payment_provider as string | null) ?? null,
  paymentId: (row.payment_id as string | null) ?? null,
  generation: row.generation as Order["generation"],
  result: (row.result as Order["result"]) ?? null,
  pdfStorageKey: (row.pdf_storage_key as string | null) ?? null,
  emailSentAt: toIso(row.email_sent_at),
  emailError: (row.email_error as string | null) ?? null,
  dataDeletedAt: toIso(row.data_deleted_at),
  createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  paidAt: toIso(row.paid_at),
  completedAt: toIso(row.completed_at),
  refundedAt: toIso(row.refunded_at),
});

const orderToRow = (order: Order) => ({
  id: order.id,
  order_number: order.orderNumber,
  access_token_hash: order.accessTokenHash,
  access_token_ciphertext: order.accessTokenCiphertext,
  status: order.status,
  payment_status: order.paymentStatus,
  input: order.input,
  email: order.email,
  price_rub: order.priceRub,
  currency: order.currency,
  is_demo: order.isDemo,
  checkout_url: order.checkoutUrl,
  payment_provider: order.paymentProvider,
  payment_id: order.paymentId,
  generation: order.generation,
  result: order.result,
  pdf_storage_key: order.pdfStorageKey,
  email_sent_at: order.emailSentAt,
  email_error: order.emailError,
  data_deleted_at: order.dataDeletedAt,
  created_at: order.createdAt,
  updated_at: order.updatedAt,
  paid_at: order.paidAt,
  completed_at: order.completedAt,
  refunded_at: order.refundedAt,
});

const paymentFromRow = (row: PaymentRow): PaymentRecord => ({
  id: String(row.id),
  orderId: String(row.order_id),
  provider: row.provider as PaymentRecord["provider"],
  providerPaymentId: String(row.provider_payment_id),
  amount: Number(row.amount),
  currency: "RUB",
  status: row.status as PaymentRecord["status"],
  confirmationUrl: (row.confirmation_url as string | null) ?? null,
  idempotenceKey: String(row.idempotence_key),
  createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  paidAt: toIso(row.paid_at),
  failureReason: (row.failure_reason as string | null) ?? null,
  metadata: (row.metadata as PaymentRecord["metadata"]) ?? {},
});

const paymentToRow = (payment: PaymentRecord) => ({
  id: payment.id,
  order_id: payment.orderId,
  provider: payment.provider,
  provider_payment_id: payment.providerPaymentId,
  amount: payment.amount,
  currency: payment.currency,
  status: payment.status,
  confirmation_url: payment.confirmationUrl,
  idempotence_key: payment.idempotenceKey,
  created_at: payment.createdAt,
  updated_at: payment.updatedAt,
  paid_at: payment.paidAt,
  failure_reason: payment.failureReason,
  metadata: payment.metadata,
});

export class SupabaseOrderRepository implements OrderRepository {
  private get db() {
    return getSupabaseAdmin();
  }

  async createOrder(order: Order): Promise<Order> {
    const { data, error } = await this.db.from("orders").insert(orderToRow(order)).select("*").single();
    if (error) throw new Error("Supabase createOrder failed: " + error.message);
    return orderFromRow(data as OrderRow);
  }

  async getOrder(id: string): Promise<Order | null> {
    const { data, error } = await this.db.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error("Supabase getOrder failed: " + error.message);
    return data ? orderFromRow(data as OrderRow) : null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.db.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
    if (error) throw new Error("Supabase getOrderByNumber failed: " + error.message);
    return data ? orderFromRow(data as OrderRow) : null;
  }

  async updateOrder(id: string, updater: (order: Order) => Order): Promise<Order | null> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.getOrder(id);
      if (!current) return null;
      const next = updater(structuredClone(current));
      next.id = id;
      if (next.updatedAt === current.updatedAt) next.updatedAt = new Date().toISOString();
      const { data, error } = await this.db
        .from("orders")
        .update(orderToRow(next))
        .eq("id", id)
        .eq("updated_at", current.updatedAt)
        .select("*")
        .maybeSingle();
      if (error) throw new Error("Supabase updateOrder failed: " + error.message);
      if (data) return orderFromRow(data as OrderRow);
    }
    throw new Error("Supabase updateOrder conflict: the order was changed concurrently three times.");
  }

  async listGenerationCandidates(_nowIso: string, limit: number): Promise<Order[]> {
    const { data, error } = await this.db
      .from("orders")
      .select("*")
      .in("status", ["paid", "generating"])
      .is("data_deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(Math.max(limit * 3, 20));
    if (error) throw new Error("Supabase listGenerationCandidates failed: " + error.message);

    const now = Date.now();
    return (data as OrderRow[])
      .map(orderFromRow)
      .filter((order) => {
        if (order.status === "paid") return true;
        return Boolean(order.generation.leaseUntil && new Date(order.generation.leaseUntil).getTime() <= now);
      })
      .slice(0, limit);
  }

  async claimGeneration(id: string, leaseUntilIso: string): Promise<Order | null> {
    const current = await this.getOrder(id);
    if (!current) return null;
    const expired = current.generation.leaseUntil
      ? new Date(current.generation.leaseUntil).getTime() <= Date.now()
      : false;
    if (!(current.status === "paid" || (current.status === "generating" && expired))) return null;

    const timestamp = new Date().toISOString();
    const next: Order = {
      ...current,
      status: "generating",
      generation: {
        ...current.generation,
        status: "running",
        step: "queued",
        progress: Math.max(current.generation.progress, 6),
        attempts: current.generation.attempts + 1,
        error: null,
        startedAt: current.generation.startedAt ?? timestamp,
        finishedAt: null,
        leaseUntil: leaseUntilIso,
      },
      updatedAt: timestamp,
    };

    const { data, error } = await this.db
      .from("orders")
      .update(orderToRow(next))
      .eq("id", id)
      .eq("status", current.status)
      .eq("updated_at", current.updatedAt)
      .select("*")
      .maybeSingle();
    if (error) throw new Error("Supabase claimGeneration failed: " + error.message);
    return data ? orderFromRow(data as OrderRow) : null;
  }

  async createPayment(payment: PaymentRecord): Promise<PaymentRecord> {
    const { data, error } = await this.db.from("payments").insert(paymentToRow(payment)).select("*").single();
    if (error) {
      if (error.code === "23505") {
        const existing = await this.getPaymentByProvider(payment.provider, payment.providerPaymentId);
        if (existing) return existing;
      }
      throw new Error("Supabase createPayment failed: " + error.message);
    }
    return paymentFromRow(data as PaymentRow);
  }

  async getPaymentByProvider(provider: string, providerPaymentId: string): Promise<PaymentRecord | null> {
    const { data, error } = await this.db
      .from("payments")
      .select("*")
      .eq("provider", provider)
      .eq("provider_payment_id", providerPaymentId)
      .maybeSingle();
    if (error) throw new Error("Supabase getPayment failed: " + error.message);
    return data ? paymentFromRow(data as PaymentRow) : null;
  }

  async updatePayment(id: string, updater: (payment: PaymentRecord) => PaymentRecord): Promise<PaymentRecord | null> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: currentRow, error: readError } = await this.db
        .from("payments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (readError) throw new Error("Supabase readPayment failed: " + readError.message);
      if (!currentRow) return null;
      const current = paymentFromRow(currentRow as PaymentRow);
      const next = updater(structuredClone(current));
      next.id = id;
      next.updatedAt = new Date().toISOString();
      const { data, error } = await this.db
        .from("payments")
        .update(paymentToRow(next))
        .eq("id", id)
        .eq("updated_at", current.updatedAt)
        .select("*")
        .maybeSingle();
      if (error) throw new Error("Supabase updatePayment failed: " + error.message);
      if (data) return paymentFromRow(data as PaymentRow);
    }
    throw new Error("Supabase updatePayment conflict: payment was changed concurrently three times.");
  }

  async clearOrderData(order: Order): Promise<Order> {
    const result = await this.updateOrder(order.id, (current) => ({
      ...current,
      accessTokenHash: "",
      accessTokenCiphertext: "",
      input: {
        childName: "Данные удалены",
        childAge: 0,
        interests: [],
        extraDetails: "",
        theme: "",
        mood: "",
        wish: "",
        email: "deleted@invalid.local",
        consentVersion: current.input.consentVersion,
      },
      email: "deleted@invalid.local",
      emailSentAt: null,
      emailError: null,
      result: null,
      pdfStorageKey: null,
      checkoutUrl: null,
      dataDeletedAt: new Date().toISOString(),
      generation: { ...current.generation, progress: 0, error: null, leaseUntil: null },
    }));
    if (!result) throw new Error("Order not found");
    return result;
  }
}
