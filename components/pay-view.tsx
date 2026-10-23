"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/client/api";
import { captureOrderToken } from "@/lib/client/order-token";
import type { PublicOrder } from "@/lib/orders/public";
import { formatPrice, maskEmail } from "@/lib/format";

type PayViewProps = {
  orderId: string;
  supportEmail: string;
};

export const PayView = ({ orderId, supportEmail }: PayViewProps) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const orderRef = useRef<PublicOrder | null>(null);

  useEffect(() => {
    setToken(captureOrderToken(orderId));
  }, [orderId]);

  const applyOrder = useCallback((next: PublicOrder) => {
    orderRef.current = next;
    setOrder(next);
  }, []);

  useEffect(() => {
    if (order && order.status !== "pending_payment") {
      router.replace("/order/" + orderId);
    }
  }, [order, orderId, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      const result = await apiRequest<{ order: PublicOrder }>("/api/orders/" + orderId + "?sync=1", { token });
      if (cancelled) return;
      if (!result.ok) {
        if (!orderRef.current) setError(result.error.message);
        return;
      }
      setError(null);
      applyOrder(result.data.order);
      if (result.data.order.status === "pending_payment") {
        timer = window.setTimeout(tick, 5000);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [applyOrder, orderId, token]);

  const testPay = async () => {
    if (!token) return;
    setBusy("test");
    setActionError(null);
    const result = await apiRequest<{ order: PublicOrder }>("/api/orders/" + orderId + "/test-pay", {
      method: "POST",
      token,
    });
    setBusy(null);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    applyOrder(result.data.order);
    router.replace("/order/" + orderId);
  };

  const newPayment = async () => {
    if (!token) return;
    setBusy("new");
    setActionError(null);
    const result = await apiRequest<{ order: PublicOrder }>("/api/orders/" + orderId + "/payment", {
      method: "POST",
      token,
    });
    setBusy(null);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    applyOrder(result.data.order);
  };

  if (!token) {
    return (
      <div className="pay-card">
        <h1>Нужна личная ссылка</h1>
        <p>Оплата открывается по личной ссылке из письма. Восстановите её по номеру заказа.</p>
        <div className="pay-actions">
          <Link className="btn btn--primary" href="/recover">
            Восстановить ссылку
          </Link>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="pay-card">
        <h1>Не удалось открыть оплату</h1>
        <p>{error}</p>
        <div className="pay-actions">
          <Link className="btn btn--primary" href="/recover">
            Восстановить ссылку
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="loading">Загружаем заказ…</div>;
  }

  const checkoutUrl = order.checkoutUrl;

  return (
    <div className="pay-card">
      <h1>Оплата заказа {order.orderNumber}</h1>
      <p>
        Сказка, в которой {order.childName} — в главной роли: {order.themeLabel.toLowerCase()}, {order.childAge} лет. После
        оплаты книга начнёт создаваться автоматически.
      </p>
      <div className="pay-amount">
        <strong>{formatPrice(order.priceRub, order.currency)}</strong>
        <span>разовый платёж, без подписки</span>
      </div>

      {order.testPaymentEnabled ? (
        <div className="notice notice--warning" style={{ marginBottom: 16 }}>
          <span aria-hidden="true">!</span>
          <span>
            Тестовый режим оплаты: деньги не списываются. Нажмите кнопку ниже, чтобы подтвердить оплату и посмотреть,
            как работает сервис целиком.
          </span>
        </div>
      ) : null}

      {order.paymentStatus === "failed" ? (
        <div className="notice notice--danger" style={{ marginBottom: 16 }}>
          <span aria-hidden="true">!</span>
          <span>Предыдущий платёж не прошёл. Создайте новую попытку — заказ и ответы сохранятся.</span>
        </div>
      ) : null}

      {actionError ? (
        <div className="notice notice--danger" style={{ marginBottom: 16 }}>
          <span aria-hidden="true">!</span>
          <span>{actionError}</span>
        </div>
      ) : null}

      <div className="pay-actions">
        {order.testPaymentEnabled ? (
          <button type="button" className="btn btn--primary" disabled={busy !== null} onClick={testPay}>
            {busy === "test" ? "Подтверждаем…" : "Подтвердить тестовую оплату"}
          </button>
        ) : null}

        {!order.testPaymentEnabled && checkoutUrl && order.paymentStatus !== "failed" ? (
          <a className="btn btn--primary" href={checkoutUrl}>
            Перейти на страницу оплаты
          </a>
        ) : null}

        {!order.testPaymentEnabled && (!checkoutUrl || order.paymentStatus === "failed") ? (
          <button type="button" className="btn btn--primary" disabled={busy !== null} onClick={newPayment}>
            {busy === "new" ? "Создаём…" : "Создать новую попытку оплаты"}
          </button>
        ) : null}

        <Link className="btn btn--ghost" href={"/order/" + orderId}>
          Вернуться к заказу
        </Link>
      </div>

      <p style={{ marginTop: 18 }}>
        Квитанция и доступ к книге придут на {maskEmail(order.email)}. Если оплата не проходит, напишите на{" "}
        <a href={"mailto:" + supportEmail} style={{ color: "var(--yellow)" }}>
          {supportEmail}
        </a>
        .
      </p>
    </div>
  );
};
