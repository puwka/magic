"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/client/api";
import { captureOrderToken } from "@/lib/client/order-token";
import type { PublicOrder } from "@/lib/orders/public";
import { publicStatusLabels } from "@/lib/orders/types";
import { GENERATION_STEPS } from "@/lib/generation/types";
import { formatDate, formatPrice, maskEmail, plural } from "@/lib/format";

type OrderViewProps = {
  orderId: string;
  supportEmail: string;
};

const terminalStatuses = new Set(["completed", "failed", "refunded"]);

const statusBadgeClass = (status: PublicOrder["status"]) => {
  if (status === "completed") return "badge badge--success";
  if (status === "failed") return "badge badge--danger";
  if (status === "pending_payment") return "badge badge--warning";
  if (status === "refunded") return "badge badge--muted";
  return "badge";
};

export const OrderView = ({ orderId, supportEmail }: OrderViewProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const orderRef = useRef<PublicOrder | null>(null);

  useEffect(() => {
    setToken(captureOrderToken(orderId));
  }, [orderId]);

  const applyOrder = useCallback((next: PublicOrder) => {
    orderRef.current = next;
    setOrder(next);
  }, []);

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

      if (!terminalStatuses.has(result.data.order.status)) {
        timer = window.setTimeout(tick, 4000);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [applyOrder, orderId, token]);

  const runAction = async (key: string, path: string) => {
    if (!token) return;
    setBusy(key);
    setActionError(null);
    const result = await apiRequest<{ order: PublicOrder }>(path, { method: "POST", token });
    setBusy(null);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    applyOrder(result.data.order);
  };

  const handleDelete = async () => {
    if (!token) return;
    const confirmed = window.confirm(
      "Удалить персональные данные заказа? История, иллюстрации и PDF будут стёрты, личная ссылка перестанет работать.",
    );
    if (!confirmed) return;
    setBusy("delete");
    setActionError(null);
    const result = await apiRequest<{ deleted: boolean }>("/api/orders/" + orderId, { method: "DELETE", token });
    setBusy(null);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    setDeleted(true);
  };

  if (!token) {
    return (
      <div className="order-shell">
        <div className="panel">
          <h2>Нужна личная ссылка</h2>
          <p>
            Этот заказ открывается только по личной ссылке с ключом доступа. Найдите письмо с заказом или восстановите
            ссылку по номеру заказа.
          </p>
          <div className="row" style={{ marginTop: 16 }}>
            <Link className="btn btn--blue" href="/recover">
              Восстановить ссылку
            </Link>
            <Link className="btn btn--ghost" href="/create">
              Создать новую сказку
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-shell">
        <div className="panel">
          <h2>Не удалось открыть заказ</h2>
          <div className="notice notice--danger" style={{ marginTop: 12 }}>
            <span aria-hidden="true">!</span>
            <span>{error}</span>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <Link className="btn btn--blue" href="/recover">
              Восстановить ссылку
            </Link>
            <button type="button" className="btn btn--ghost" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-shell">
        <div className="loading">Загружаем заказ…</div>
      </div>
    );
  }

  const tokenQuery = "?token=" + encodeURIComponent(token);
  const result = order.result;
  const coverUrl = result ? result.coverPath + tokenQuery : null;
  const pdfUrl = result ? result.pdfPath + tokenQuery : null;
  const stepIndex = GENERATION_STEPS.findIndex((step) => step.id === order.progress.step);
  const isFinished = order.status === "completed";
  const showProgress = order.status === "paid" || order.status === "generating" || isFinished;

  return (
    <div className="order-shell">
      <div>
        <div className="order-head">
          <div>
            <h1>
              {isFinished && result ? result.title : "Заказ " + order.orderNumber}
            </h1>
            <p>
              {isFinished && result ? result.subtitle : null}
              {isFinished && result ? <br /> : null}
              Герой: {order.childName}, {order.childAge} {plural(order.childAge, "год", "года", "лет")} ·{" "}
              {order.themeLabel} · заказ от {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="row">
            {order.isDemo ? <span className="badge badge--demo">Демо-пример</span> : null}
            <span className={statusBadgeClass(order.status)}>{publicStatusLabels[order.status]}</span>
          </div>
        </div>

        {order.isDemo ? (
          <div className="notice notice--warning" style={{ marginBottom: 18 }}>
            <span aria-hidden="true">!</span>
            <span>
              Этот заказ создан в демо-режиме: текст собран демонстрационным генератором, иллюстрации — встроенным
              рисовальщиком. Это показывает полный цикл сервиса, но не является реальной AI-генерацией.
            </span>
          </div>
        ) : null}

        {deleted ? (
          <div className="notice notice--success" style={{ marginBottom: 18 }}>
            <span aria-hidden="true">✓</span>
            <span>Персональные данные удалены. Личная ссылка больше не действует.</span>
          </div>
        ) : null}

        {order.status === "pending_payment" ? (
          <div className="panel">
            <h2>Осталось оплатить</h2>
            <p>
              Заказ принят. После оплаты книга начнёт создаваться автоматически, а готовый PDF придёт на{" "}
              {maskEmail(order.email)}.
            </p>
            {order.paymentStatus === "failed" ? (
              <div className="notice notice--danger" style={{ margin: "14px 0" }}>
                <span aria-hidden="true">!</span>
                <span>Предыдущая попытка оплаты не прошла. Можно создать новую — заказ сохранится.</span>
              </div>
            ) : null}
            <div className="row" style={{ marginTop: 16 }}>
              <Link className="btn btn--primary" href={"/pay/" + order.id + tokenQuery}>
                Перейти к оплате {formatPrice(order.priceRub, order.currency)}
              </Link>
              {order.paymentStatus === "failed" ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={busy !== null}
                  onClick={() => runAction("payment", "/api/orders/" + orderId + "/payment")}
                >
                  {busy === "payment" ? "Создаём…" : "Создать новую попытку оплаты"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {order.status === "failed" ? (
          <div className="panel">
            <h2>Генерация прервалась</h2>
            <p>
              Оплата подтверждена, повторная оплата не потребуется. Запустите ещё одну попытку — обычно этого
              достаточно.
            </p>
            {order.error ? (
              <div className="notice notice--danger" style={{ margin: "14px 0" }}>
                <span aria-hidden="true">!</span>
                <span>{order.error}</span>
              </div>
            ) : null}
            <p className="small">
              Использовано попыток: {order.progress.attempts} из {order.progress.maxAttempts}.
            </p>
            <div className="row" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy !== null || order.progress.attempts >= order.progress.maxAttempts}
                onClick={() => runAction("retry", "/api/orders/" + orderId + "/retry")}
              >
                {busy === "retry" ? "Запускаем…" : "Повторить генерацию"}
              </button>
              <a className="btn btn--ghost" href={"mailto:" + supportEmail}>
                Написать в поддержку
              </a>
            </div>
            {order.progress.attempts >= order.progress.maxAttempts ? (
              <p className="small" style={{ marginTop: 12 }}>
                Лимит попыток исчерпан. Напишите в поддержку — поможем без повторной оплаты.
              </p>
            ) : null}
          </div>
        ) : null}

        {showProgress ? (
          <div className="panel">
            <h2>{isFinished ? "Книга готова" : "Создаём вашу книгу"}</h2>
            <p>
              {isFinished
                ? "Можно скачать PDF или прочитать историю прямо здесь."
                : "Можно закрыть страницу — процесс продолжится, а ссылка на готовую книгу придёт на почту."}
            </p>
            <div className="progress-block">
              <div className="progress-meta">
                <span>{isFinished ? "Завершено" : "Этап: " + (GENERATION_STEPS[stepIndex]?.label ?? "Подготовка")}</span>
                <span>{isFinished ? 100 : order.progress.percent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: (isFinished ? 100 : Math.max(4, order.progress.percent)) + "%" }} />
              </div>
            </div>
            <div className="timeline">
              {GENERATION_STEPS.map((step, index) => {
                const state = isFinished || index < stepIndex ? " is-done" : index === stepIndex ? " is-active" : "";
                return (
                  <div className={"timeline__item" + state} key={step.id}>
                    <span className="timeline__dot" aria-hidden="true">
                      {isFinished || index < stepIndex ? "✓" : index + 1}
                    </span>
                    <div>
                      <strong>{step.label}</strong>
                      <small>
                        {isFinished || index < stepIndex
                          ? "готово"
                          : index === stepIndex
                            ? "в работе"
                            : "дальше"}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="notice notice--danger" style={{ marginBottom: 18 }}>
            <span aria-hidden="true">!</span>
            <span>{actionError}</span>
          </div>
        ) : null}

        {isFinished && result ? (
          <>
            <div className="panel">
              <div className="result-head">
                <div className="result-cover">
                  {coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={coverUrl} alt={"Обложка книги «" + result.title + "»"} />
                  ) : null}
                </div>
                <div>
                  <h2>{result.title}</h2>
                  <p>{result.subtitle}</p>
                  <p className="small" style={{ marginTop: 10 }}>
                    {result.dedication}
                  </p>
                  <div className="result-actions">
                    {pdfUrl ? (
                      <a className="btn btn--primary" href={pdfUrl} download>
                        Скачать PDF
                      </a>
                    ) : null}
                    <a className="btn btn--ghost" href="#reader">
                      Читать здесь
                    </a>
                  </div>
                  <p className="small" style={{ marginTop: 12 }}>
                    {result.chapterCount} {plural(result.chapterCount, "глава", "главы", "глав")} ·{" "}
                    {result.illustrations.length} {plural(result.illustrations.length, "иллюстрация", "иллюстрации", "иллюстраций")}{" "}
                    · PDF
                  </p>
                </div>
              </div>

              {order.emailDelivery === "sent" ? (
                <div className="notice notice--success" style={{ marginTop: 18 }}>
                  <span aria-hidden="true">✓</span>
                  <span>Письмо с готовой книгой отправлено на {maskEmail(order.email)}.</span>
                </div>
              ) : order.emailDelivery === "failed" ? (
                <div className="notice notice--warning" style={{ marginTop: 18 }}>
                  <span aria-hidden="true">!</span>
                  <span>
                    Не удалось отправить письмо на {maskEmail(order.email)}. Книга доступна на этой странице — скачайте
                    PDF или напишите в поддержку.
                  </span>
                </div>
              ) : (
                <div className="notice notice--info" style={{ marginTop: 18 }}>
                  <span aria-hidden="true">•</span>
                  <span>Письмо на {maskEmail(order.email)} готовится к отправке.</span>
                </div>
              )}

              {result.warnings.length > 0 ? (
                <div className="notice notice--info" style={{ marginTop: 12 }}>
                  <span aria-hidden="true">•</span>
                  <span>{result.warnings.join(" ")}</span>
                </div>
              ) : null}
            </div>

            <div className="panel" id="reader">
              <h2>Читать сказку</h2>
              <p>Откройте любую главу — иллюстрации уже вплетены в историю.</p>
              <div className="reader">
                {(result.story?.chapters ?? []).map((chapter, index) => {
                  const chapterIllustrations = result.illustrations.filter(
                    (illustration) => illustration.chapterIndex === index,
                  );
                  return (
                    <details className="chapter" key={chapter.title} open={index === 0}>
                      <summary className="chapter__head">
                        <strong>
                          {index + 1}. {chapter.title}
                        </strong>
                        <span>{chapterIllustrations.length > 0 ? "с иллюстрацией" : "текст"}</span>
                      </summary>
                      <div className="chapter__body">
                        {chapterIllustrations.map((illustration) => (
                          <div className="chapter__art" key={illustration.key}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={illustration.path + tokenQuery} alt={illustration.alt} />
                          </div>
                        ))}
                        {chapter.text
                          .split("\n")
                          .filter((paragraph) => paragraph.trim().length > 0)
                          .map((paragraph, paragraphIndex) => (
                            <p key={paragraphIndex}>{paragraph}</p>
                          ))}
                      </div>
                    </details>
                  );
                })}

                {result.story?.letter ? (
                  <details className="chapter">
                    <summary className="chapter__head">
                      <strong>Письмо-поздравление</strong>
                      <span>сертификат внутри PDF</span>
                    </summary>
                    <div className="chapter__body">
                      {result.story.letter
                        .split("\n")
                        .filter((paragraph) => paragraph.trim().length > 0)
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      {result.story.closingLine ? <p>{result.story.closingLine}</p> : null}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <aside>
        <div className="side-card">
          <h3>Заказ</h3>
          <dl className="side-list">
            <div>
              <dt>Номер</dt>
              <dd className="mono">{order.orderNumber}</dd>
            </div>
            <div>
              <dt>Создан</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt>Оплата</dt>
              <dd>{order.paymentStatus === "paid" ? "подтверждена" : order.paymentStatus === "failed" ? "не прошла" : "ожидает"}</dd>
            </div>
            <div>
              <dt>Сумма</dt>
              <dd>{formatPrice(order.priceRub, order.currency)}</dd>
            </div>
            <div>
              <dt>Почта</dt>
              <dd>{maskEmail(order.email)}</dd>
            </div>
          </dl>
        </div>

        <div className="side-card">
          <h3>Помощь</h3>
          <p className="small">
            Что-то пошло не так? Напишите на{" "}
            <a href={"mailto:" + supportEmail} style={{ color: "var(--blue)" }}>
              {supportEmail}
            </a>{" "}
            и укажите номер заказа. Повторная генерация запускается без дополнительной оплаты.
          </p>
          <p className="small" style={{ marginTop: 10 }}>
            Сохраните личную ссылку на эту страницу: она открывает заказ без пароля.
          </p>
        </div>

        <div className="side-card">
          <h3>Данные</h3>
          <p className="small">
            Персональные данные можно удалить: заказ и файлы будут стёрты, а ссылка перестанет действовать.
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn--danger btn--small"
              disabled={busy !== null || deleted || order.status === "generating" || order.status === "paid"}
              onClick={handleDelete}
            >
              {busy === "delete" ? "Удаляем…" : "Удалить мои данные"}
            </button>
          </div>
          {order.status === "generating" || order.status === "paid" ? (
            <p className="small" style={{ marginTop: 10 }}>
              Пока книга создаётся, удаление недоступно.
            </p>
          ) : null}
          <p className="small" style={{ marginTop: 10 }}>
            Подробнее — в{" "}
            <Link href="/legal/privacy" style={{ color: "var(--blue)" }}>
              политике данных
            </Link>
            .
          </p>
        </div>
      </aside>
    </div>
  );
};
