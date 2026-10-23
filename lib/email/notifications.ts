import { getEmailProvider } from "@/lib/email";
import { buildBookReadyEmail, buildOrderCreatedEmail } from "@/lib/email/messages";
import { getOrderEmailLink } from "@/lib/orders/service";
import { getOrderRepository } from "@/lib/orders/repository";
import type { Order } from "@/lib/orders/types";

const recordDelivery = async (orderId: string, sentAt: string | null, error: string | null) => {
  const repository = getOrderRepository();
  await repository.updateOrder(orderId, (current) => ({
    ...current,
    emailSentAt: sentAt,
    emailError: error,
  }));
};

const deliver = async (order: Order, build: (order: Order, link: string) => ReturnType<typeof buildOrderCreatedEmail>) => {
  if (order.dataDeletedAt) return { sent: false, error: "Данные заказа удалены." };

  const link = getOrderEmailLink(order);
  if (!link) {
    await recordDelivery(order.id, null, "Не удалось подготовить личную ссылку для письма.");
    return { sent: false, error: "Не удалось подготовить личную ссылку для письма." };
  }

  const provider = getEmailProvider();
  if (!provider) {
    await recordDelivery(order.id, null, "Отправка писем не настроена.");
    return { sent: false, error: "Отправка писем не настроена." };
  }

  try {
    await provider.send(build(order, link));
    await recordDelivery(order.id, new Date().toISOString(), null);
    return { sent: true, error: null };
  } catch (error) {
    console.error("[magia] Email delivery failed", error);
    await recordDelivery(order.id, null, "Не удалось отправить письмо. Личную ссылку можно запросить повторно.");
    return {
      sent: false,
      error: "Не удалось отправить письмо. Личную ссылку можно запросить повторно.",
    };
  }
};

export const sendOrderCreatedEmail = (order: Order) => deliver(order, buildOrderCreatedEmail);

export const sendBookReadyEmail = (order: Order) => deliver(order, buildBookReadyEmail);
