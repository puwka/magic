import { getAppConfig, isGenerationAvailable, isTestPaymentAllowed } from "@/lib/config";
import { AppError } from "@/lib/http";
import type { Order, OrderRepository, PaymentRecord } from "@/lib/orders/types";
import type { OrderInput } from "@/lib/validation/order";
import { CONSENT_VERSION } from "@/lib/validation/order";
import {
  buildOrderLink,
  decryptAccessToken,
  encryptAccessToken,
  generateAccessToken,
  hashAccessToken,
  newId,
  newOrderNumber,
  verifyAccessToken,
} from "@/lib/security/tokens";
import { getOrderRepository } from "@/lib/orders/repository";
import { getPaymentProvider } from "@/lib/payments";
import type { CreatedPayment } from "@/lib/payments/types";
import { deleteOrderAssets } from "@/lib/orders/assets";

const getRepository = (): OrderRepository => getOrderRepository();

const lastPaymentSyncAt = new Map<string, number>();

const emptyGeneration = (): Order["generation"] => ({
  status: "idle",
  step: "queued",
  progress: 0,
  attempts: 0,
  error: null,
  startedAt: null,
  finishedAt: null,
  leaseUntil: null,
});

export type OrderSession = {
  order: Order;
  token: string;
};

const createOrderRecord = (input: OrderInput, config: ReturnType<typeof getAppConfig>) => {
  const now = new Date().toISOString();
  const token = generateAccessToken();
  const order: Order = {
    id: newId(),
    orderNumber: newOrderNumber(),
    accessTokenHash: hashAccessToken(token),
    accessTokenCiphertext: encryptAccessToken(token, config.orderAccessSecret),
    status: "pending_payment",
    paymentStatus: "pending",
    input: {
      childName: input.childName,
      childAge: input.childAge,
      interests: input.interests,
      extraDetails: input.extraDetails,
      theme: input.theme,
      mood: input.mood,
      wish: input.wish,
      email: input.email,
      consentVersion: CONSENT_VERSION,
    },
    email: input.email,
    priceRub: config.priceRub,
    currency: "RUB",
    isDemo: config.demoMode,
    checkoutUrl: null,
    paymentProvider: null,
    paymentId: null,
    generation: emptyGeneration(),
    result: null,
    pdfStorageKey: null,
    emailSentAt: null,
    emailError: null,
    dataDeletedAt: null,
    createdAt: now,
    updatedAt: now,
    paidAt: null,
    completedAt: null,
    refundedAt: null,
  };
  return { order, token };
};

const createPaymentRecord = (
  order: Order,
  created: CreatedPayment,
  idempotenceKey: string,
): PaymentRecord => {
  const now = new Date().toISOString();
  return {
    id: newId(),
    orderId: order.id,
    provider: created.provider,
    providerPaymentId: created.providerPaymentId,
    amount: created.amount,
    currency: "RUB",
    status: "pending",
    confirmationUrl: created.confirmationUrl,
    idempotenceKey,
    createdAt: now,
    updatedAt: now,
    paidAt: null,
    failureReason: null,
    metadata: { orderId: order.id },
  };
};

export const createOrder = async (input: OrderInput) => {
  const config = getAppConfig();
  if (config.orderAccessSecret.length < 32) {
    throw new AppError("Сервис временно недоступен: не настроен ключ доступа.", 503, "not_configured");
  }
  if (config.appEnv === "production" && config.demoMode) {
    throw new AppError("Сервис настроен небезопасно. Демо-режим запрещён.", 503, "not_configured");
  }
  if (config.appEnv === "production" && config.payment.provider === "test") {
    throw new AppError("Оплата временно недоступна: платёжный провайдер не настроен.", 503, "payment_unavailable");
  }
  if (!isGenerationAvailable(config)) {
    throw new AppError(
      "Создание сказок временно приостановлено. Мы настраиваем генерацию — попробуйте позже.",
      503,
      "generation_unavailable",
    );
  }

  const { order, token } = createOrderRecord(input, config);
  const provider = getPaymentProvider();
  const idempotenceKey = "magia-" + order.id;

  let created: CreatedPayment;
  try {
    created = await provider.createPayment(order, idempotenceKey);
  } catch (error) {
    console.error("[magia] Payment creation failed", error);
    throw new AppError("Не удалось начать оплату. Попробуйте ещё раз.", 502, "payment_unavailable");
  }

  const payment = createPaymentRecord(order, created, idempotenceKey);
  order.paymentProvider = created.provider;
  order.paymentId = created.providerPaymentId;
  order.checkoutUrl = created.confirmationUrl;
  order.updatedAt = new Date().toISOString();

  const repository = getRepository();
  await repository.createOrder(order);
  await repository.createPayment(payment);

  return {
    order,
    token,
    orderLink: buildOrderLink(config.appUrl, order.id, token),
    checkoutUrl: created.confirmationUrl,
  };
};

export const authorizeOrder = async (orderId: string, token: string | null): Promise<Order | null> => {
  if (!token || token.length > 300) return null;
  const order = await getRepository().getOrder(orderId);
  if (!order || !verifyAccessToken(token, order.accessTokenHash)) return null;
  return order;
};

export const requireOrder = async (orderId: string, token: string | null) => {
  const order = await authorizeOrder(orderId, token);
  if (!order) throw new AppError("Заказ не найден или ссылка доступа недействительна.", 404, "order_not_found");
  return order;
};

export const confirmPayment = async (params: {
  provider: PaymentRecord["provider"];
  providerPaymentId: string;
  amount: number;
  currency: string;
}) => {
  const repository = getRepository();
  const payment = await repository.getPaymentByProvider(params.provider, params.providerPaymentId);
  if (!payment) throw new AppError("Платёж не найден.", 404, "payment_not_found");

  const order = await repository.getOrder(payment.orderId);
  if (!order) throw new AppError("Заказ не найден.", 404, "order_not_found");
  if (order.dataDeletedAt) {
    console.warn("[magia] Payment confirmation ignored for a deleted order");
    return order;
  }

  if (payment.amount !== params.amount || payment.currency !== params.currency) {
    throw new AppError("Сумма или валюта платежа не совпадают.", 400, "payment_mismatch");
  }
  if (order.priceRub !== params.amount) {
    throw new AppError("Сумма платежа не соответствует заказу.", 400, "payment_mismatch");
  }

  if (payment.status === "paid" && order.paymentStatus === "paid") {
    return order;
  }

  const now = new Date().toISOString();
  await repository.updatePayment(payment.id, (current) => {
    if (current.status === "paid") return current;
    return {
      ...current,
      status: "paid",
      paidAt: now,
      failureReason: null,
    };
  });

  const updated = await repository.updateOrder(order.id, (current) => {
    if (current.paymentStatus === "paid" || current.status === "refunded") return current;
    return {
      ...current,
      status: "paid",
      paymentStatus: "paid",
      paidAt: current.paidAt ?? now,
      generation: {
        ...current.generation,
        status: "queued",
        step: "queued",
        progress: Math.max(4, current.generation.progress),
        error: null,
        finishedAt: null,
        leaseUntil: null,
      },
    };
  });

  if (!updated) throw new AppError("Заказ не найден.", 404, "order_not_found");
  return updated;
};

export const confirmTestPayment = async (orderId: string, token: string | null) => {
  const config = getAppConfig();
  if (!isTestPaymentAllowed(config)) {
    throw new AppError("Тестовые платежи отключены.", 403, "test_payment_disabled");
  }
  const order = await requireOrder(orderId, token);
  if (order.paymentProvider !== "test" || !order.paymentId) {
    throw new AppError("Этот заказ не использует тестовую оплату.", 400, "not_test_order");
  }
  if (order.paymentStatus === "paid") return order;

  return confirmPayment({
    provider: "test",
    providerPaymentId: order.paymentId,
    amount: order.priceRub,
    currency: order.currency,
  });
};

export const syncOrderPayment = async (order: Order, force = false): Promise<Order> => {  if (order.paymentStatus !== "pending" || order.paymentProvider !== "yookassa" || !order.paymentId) {
    return order;
  }

  const now = Date.now();
  const lastSync = lastPaymentSyncAt.get(order.id) ?? 0;
  if (!force && now - lastSync < 8_000) return order;
  lastPaymentSyncAt.set(order.id, now);

  try {
    const provider = getPaymentProvider();
    if (provider.id !== "yookassa") return order;
    const providerState = await provider.getPayment(order.paymentId);

    if (providerState.status === "succeeded") {
      if (providerState.orderId && providerState.orderId !== order.id) {
        console.error("[magia] YooKassa payment metadata does not match the order");
        return order;
      }
      return confirmPayment({
        provider: "yookassa",
        providerPaymentId: order.paymentId,
        amount: providerState.amount,
        currency: providerState.currency,
      });
    }

    if (providerState.status === "canceled" || providerState.status === "failed") {
      const repository = getRepository();
      const payment = await repository.getPaymentByProvider("yookassa", order.paymentId);
      if (payment && payment.status === "pending") {
        await repository.updatePayment(payment.id, (current) => ({
          ...current,
          status: "failed",
          failureReason: "Платёж отменён или не прошёл.",
        }));
      }
      const updated = await repository.updateOrder(order.id, (current) => {
        if (current.paymentStatus !== "pending") return current;
        return { ...current, paymentStatus: "failed" };
      });
      return updated ?? order;
    }
  } catch (error) {
    console.error("[magia] Payment status sync failed", error);
  }

  return order;
};

export const createReplacementPayment = async (orderId: string, token: string | null) => {
  const order = await requireOrder(orderId, token);
  if (order.status !== "pending_payment") {
    throw new AppError("Для этого заказа оплата уже не требуется.", 409, "payment_not_required");
  }
  if (order.paymentStatus === "paid") return order;
  if (order.paymentStatus !== "failed") {
    throw new AppError("По заказу уже есть активная попытка оплаты.", 409, "payment_already_pending");
  }

  const provider = getPaymentProvider();
  const idempotenceKey = "magia-" + order.id + "-" + Date.now();

  let created: CreatedPayment;
  try {
    created = await provider.createPayment(order, idempotenceKey);
  } catch (error) {
    console.error("[magia] Replacement payment creation failed", error);
    throw new AppError("Не удалось начать оплату. Попробуйте ещё раз.", 502, "payment_unavailable");
  }

  const repository = getRepository();
  await repository.createPayment(createPaymentRecord(order, created, idempotenceKey));
  const updated = await repository.updateOrder(order.id, (current) => ({
    ...current,
    paymentProvider: created.provider,
    paymentId: created.providerPaymentId,
    checkoutUrl: created.confirmationUrl,
    paymentStatus: "pending",
    updatedAt: new Date().toISOString(),
  }));

  if (!updated) throw new AppError("Заказ не найден.", 404, "order_not_found");
  return updated;
};

export const resetFailedOrderForRetry = async (orderId: string, token: string | null) => {
  const config = getAppConfig();
  const order = await requireOrder(orderId, token);
  if (order.status !== "failed") {
    throw new AppError("Повторная попытка доступна только для заказа с ошибкой.", 409, "retry_not_allowed");
  }
  if (order.paymentStatus !== "paid") {
    throw new AppError("Генерация доступна только после подтверждённой оплаты.", 409, "payment_required");
  }
  if (order.generation.attempts >= config.generationMaxAttempts) {
    throw new AppError(
      "Лимит попыток генерации исчерпан. Напишите в поддержку — мы поможем без повторной оплаты.",
      409,
      "attempts_exhausted",
    );
  }

  const updated = await getRepository().updateOrder(order.id, (current) => {
    if (current.status !== "failed" || current.paymentStatus !== "paid" || current.dataDeletedAt) return current;
    return {
      ...current,
      status: "paid",
      generation: {
        ...current.generation,
        status: "queued",
        step: "queued",
        progress: Math.max(4, current.generation.progress),
        error: null,
        finishedAt: null,
        leaseUntil: null,
      },
    };
  });

  if (!updated) throw new AppError("Заказ не найден.", 404, "order_not_found");
  if (updated.status !== "paid" || updated.generation.status !== "queued") {
    throw new AppError("Повторная попытка сейчас недоступна.", 409, "retry_not_allowed");
  }
  return updated;
};

export const deleteOrderData = async (orderId: string, token: string | null) => {
  const order = await requireOrder(orderId, token);
  if (order.dataDeletedAt) return order;
  if (order.status === "generating" || order.status === "paid") {
    throw new AppError(
      "Пока книга создаётся, удалить данные нельзя. Дождитесь завершения или напишите в поддержку.",
      409,
      "generation_in_progress",
    );
  }

  try {
    await deleteOrderAssets(order);
  } catch (error) {
    console.error("[magia] Could not remove all order assets before data deletion", error);
  }

  return getRepository().clearOrderData(order);
};

export const getOrderEmailLink = (order: Order) => {
  const config = getAppConfig();
  const token = decryptTokenSafe(order.accessTokenCiphertext, config.orderAccessSecret);
  if (!token) return null;
  return buildOrderLink(config.appUrl, order.id, token);
};

export const findOrderForRecovery = async (orderNumber: string, email: string) => {
  const normalizedNumber = orderNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  const order = await getRepository().getOrderByNumber(normalizedNumber);
  if (!order || order.dataDeletedAt) return null;
  if (order.email.toLowerCase() !== normalizedEmail) return null;
  return order;
};

const decryptTokenSafe = (ciphertext: string, secret: string) => {
  try {
    return decryptAccessToken(ciphertext, secret);
  } catch {
    return null;
  }
};
