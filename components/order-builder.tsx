"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AGE_OPTIONS,
  INTEREST_OPTIONS,
  MAX_EXTRA_LENGTH,
  MAX_INTERESTS,
  MAX_NAME_LENGTH,
  MAX_WISH_LENGTH,
  MOODS,
  THEMES,
  getMood,
  getTheme,
} from "@/lib/content/options";
import { apiRequest } from "@/lib/client/api";
import { storeOrderToken } from "@/lib/client/order-token";
import { emptyBuilderDraft, validateBuilderStep, type BuilderDraft, type BuilderErrors } from "@/lib/validation/client";
import { formatPrice } from "@/lib/format";

type OrderBuilderProps = {
  priceRub: number;
  demoMode: boolean;
  generationAvailable: boolean;
  supportEmail: string;
  consentVersion: string;
};

type CreateOrderResponse = {
  order: { id: string; orderNumber: string; status: string };
  accessToken: string;
  orderLink: string;
};

const STORAGE_KEY = "magia:builder-draft-v1";

const stepTitles = ["Герой", "История", "Проверка и оплата"] as const;

export const OrderBuilder = ({ priceRub, demoMode, generationAvailable, supportEmail, consentVersion }: OrderBuilderProps) => {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [draft, setDraft] = useState<BuilderDraft>(emptyBuilderDraft);
  const [errors, setErrors] = useState<BuilderErrors>({});
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<BuilderDraft>;
      setDraft((current) => ({
        ...current,
        childName: typeof parsed.childName === "string" ? parsed.childName.slice(0, MAX_NAME_LENGTH) : current.childName,
        childAge: typeof parsed.childAge === "number" ? parsed.childAge : current.childAge,
        interests: Array.isArray(parsed.interests)
          ? parsed.interests.filter((id): id is string => typeof id === "string").slice(0, MAX_INTERESTS)
          : current.interests,
        extraDetails: typeof parsed.extraDetails === "string" ? parsed.extraDetails.slice(0, MAX_EXTRA_LENGTH) : "",
        theme: typeof parsed.theme === "string" ? parsed.theme : current.theme,
        mood: typeof parsed.mood === "string" ? parsed.mood : current.mood,
        wish: typeof parsed.wish === "string" ? parsed.wish.slice(0, MAX_WISH_LENGTH) : "",
      }));
    } catch {
      // ignore broken drafts
    }
  }, []);

  useEffect(() => {
    try {
      const { childName, childAge, interests, extraDetails, theme, mood, wish } = draft;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ childName, childAge, interests, extraDetails, theme, mood, wish }),
      );
    } catch {
      // storage can be unavailable — the draft just will not be restored
    }
  }, [draft]);

  const theme = getTheme(draft.theme);
  const mood = getMood(draft.mood);
  const displayName = draft.childName.trim() || "герой";
  const price = formatPrice(priceRub, "RUB");

  const update = useCallback(<K extends keyof BuilderDraft>(field: K, value: BuilderDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const toggleInterest = (id: string) => {
    setDraft((current) => {
      if (current.interests.includes(id)) {
        return { ...current, interests: current.interests.filter((item) => item !== id) };
      }
      if (current.interests.length >= MAX_INTERESTS) return current;
      return { ...current, interests: [...current.interests, id] };
    });
    setErrors((current) => ({ ...current, interests: undefined }));
  };

  const goToStep = (next: 0 | 1 | 2) => {
    setServerError(null);
    if (next > step) {
      for (let index = step; index < next; index += 1) {
        const found = validateBuilderStep(index as 0 | 1 | 2, draft);
        if (Object.keys(found).length > 0) {
          setErrors(found);
          return;
        }
      }
    }
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    if (!generationAvailable) {
      setServerError("Создание сказок временно приостановлено. Попробуйте позже или напишите в поддержку.");
      return;
    }

    for (const index of [0, 1, 2] as const) {
      const found = validateBuilderStep(index, draft);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(index);
        return;
      }
    }

    setSubmitting(true);
    const result = await apiRequest<CreateOrderResponse>("/api/orders", {
      method: "POST",
      body: {
        childName: draft.childName.trim(),
        childAge: draft.childAge,
        interests: draft.interests,
        extraDetails: draft.extraDetails.trim(),
        theme: draft.theme,
        mood: draft.mood,
        wish: draft.wish.trim(),
        email: draft.email.trim().toLowerCase(),
        consent: true,
        consentVersion,
        company,
      },
    });

    if (!result.ok) {
      setSubmitting(false);
      setServerError(result.error.message);
      return;
    }

    storeOrderToken(result.data.order.id, result.data.accessToken);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push("/pay/" + result.data.order.id);
  };

  const reviewRows = useMemo(
    () => [
      { label: "Герой", value: draft.childName.trim() || "—", step: 0 as const },
      { label: "Возраст", value: draft.childAge + " лет", step: 0 as const },
      {
        label: "Увлечения",
        value:
          draft.interests
            .map((id) => INTEREST_OPTIONS.find((item) => item.id === id)?.label)
            .filter(Boolean)
            .join(", ") || "не выбраны",
        step: 0 as const,
      },
      { label: "Тематика", value: theme.label, step: 1 as const },
      { label: "Характер истории", value: mood.label, step: 1 as const },
    ],
    [draft.childAge, draft.childName, draft.interests, mood.label, theme.label],
  );

  return (
    <div className="builder-shell">
      <div className="builder-panel">
        <div className="builder-progress">
          {stepTitles.map((title, index) => {
            const state = index === step ? " is-active" : index < step ? " is-done" : "";
            return (
              <button
                key={title}
                type="button"
                className={"builder-progress__item" + state}
                onClick={() => goToStep(index as 0 | 1 | 2)}
              >
                <b>{index + 1}</b>
                {title}
              </button>
            );
          })}
        </div>

        {demoMode ? (
          <div className="notice notice--warning" role="note" style={{ marginBottom: 20 }}>
            <span aria-hidden="true">!</span>
            <span>
              <strong>Демо-режим.</strong> Книга будет создана демонстрационным генератором: текст — по готовым
              сюжетным профилям, иллюстрации — встроенным рисовальщиком. Это честное превью сервиса, а не реальная
              AI-генерация.
            </span>
          </div>
        ) : null}

        {!generationAvailable ? (
          <div className="notice notice--danger" role="alert" style={{ marginBottom: 20 }}>
            <span aria-hidden="true">!</span>
            <span>
              Создание сказок временно приостановлено: генератор ещё не настроен. Напишите в поддержку
              {" "}
              <a href={"mailto:" + supportEmail}>{supportEmail}</a>, и мы сообщим, когда всё заработает.
            </span>
          </div>
        ) : null}

        <form onSubmit={submit} noValidate>
          {step === 0 ? (
            <div className="builder-step">
              <h2>Расскажите о герое</h2>
              <p className="builder-step__lead">
                Имя и детали попадут в текст и иллюстрации. Никаких фотографий и лишних данных — только то, что
                действительно нужно для истории.
              </p>

              <div className="builder-layout">
                <div>
                  <div className="field">
                    <label htmlFor="child-name">Имя ребёнка *</label>
                    <input
                      id="child-name"
                      className="input"
                      type="text"
                      maxLength={MAX_NAME_LENGTH}
                      value={draft.childName}
                      placeholder="Например, Маша"
                      autoComplete="off"
                      onChange={(event) => update("childName", event.target.value)}
                    />
                    {errors.childName ? <span className="field-error">{errors.childName}</span> : null}
                  </div>

                  <div className="field">
                    <span className="field-label">Возраст *</span>
                    <div className="chips">
                      {AGE_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          className="chip chip--square"
                          aria-pressed={draft.childAge === value}
                          onClick={() => update("childAge", value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    {errors.childAge ? <span className="field-error">{errors.childAge}</span> : null}
                  </div>

                  <div className="field">
                    <span className="field-label">
                      Увлечения — до {MAX_INTERESTS} штук
                    </span>
                    <div className="chips">
                      {INTEREST_OPTIONS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="chip"
                          aria-pressed={draft.interests.includes(item.id)}
                          onClick={() => toggleInterest(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {errors.interests ? <span className="field-error">{errors.interests}</span> : null}
                  </div>

                  <div className="field">
                    <label htmlFor="child-details">Особенные детали</label>
                    <textarea
                      id="child-details"
                      className="textarea"
                      maxLength={MAX_EXTRA_LENGTH}
                      value={draft.extraDetails}
                      placeholder="Любимая игрушка, привычки, смешные словечки, важные для семьи моменты…"
                      onChange={(event) => update("extraDetails", event.target.value)}
                    />
                    <span className="field-hint">
                      Необязательно. {draft.extraDetails.length} / {MAX_EXTRA_LENGTH} символов
                    </span>
                    {errors.extraDetails ? <span className="field-error">{errors.extraDetails}</span> : null}
                  </div>
                </div>

                <div className="live-preview" aria-live="polite">
                  <div className="live-preview__top">
                    <span>Будущая книга</span>
                    <span className="live-status">
                      <i aria-hidden="true" /> ЧЕРНОВИК
                    </span>
                  </div>
                  <div className="live-book">
                    <div className="live-book__title">
                      Моя
                      <br />
                      <em>сказка</em>
                    </div>
                    <div className="live-book__art">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={"/images/themes/" + theme.id + ".jpg"} alt="" />
                    </div>
                    <div className="live-book__name">{displayName} · личная сказка</div>
                  </div>
                  <div className="live-caption">
                    <strong>История, в которой {displayName} — в главной роли</strong>
                    <span>
                      {theme.label} · {draft.childAge} лет
                    </span>
                  </div>
                  <div className="live-preview__foot">
                    <span aria-hidden="true">✦</span> Обложку и иллюстрации соберём после оплаты
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="builder-step">
              <h2>Какой будет история</h2>
              <p className="builder-step__lead">
                Тематика задаёт мир и иллюстрации, характер — настроение текста. Пожелание поможет сделать сюжет
                точнее.
              </p>

              <div className="field">
                <span className="field-label">Тематика *</span>
                <div className="theme-cards">
                  {THEMES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="theme-card"
                      aria-pressed={draft.theme === item.id}
                      onClick={() => update("theme", item.id)}
                    >
                      <span className="theme-card__art">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={"/images/themes/" + item.id + ".jpg"} alt="" />
                      </span>
                      <strong>{item.label}</strong>
                      <small>{item.short}</small>
                    </button>
                  ))}
                </div>
                {errors.theme ? <span className="field-error">{errors.theme}</span> : null}
              </div>

              <div className="field">
                <span className="field-label">Характер истории *</span>
                <div className="chips">
                  {MOODS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="chip"
                      aria-pressed={draft.mood === item.id}
                      onClick={() => update("mood", item.id)}
                      title={item.description}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="field-hint">{mood.description}</span>
                {errors.mood ? <span className="field-error">{errors.mood}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="story-wish">Пожелание к сюжету</label>
                <textarea
                  id="story-wish"
                  className="textarea"
                  maxLength={MAX_WISH_LENGTH}
                  value={draft.wish}
                  placeholder="Например: пусть в сказке будет маленький друг и счастливый финал."
                  onChange={(event) => update("wish", event.target.value)}
                />
                <span className="field-hint">
                  Необязательно. {draft.wish.length} / {MAX_WISH_LENGTH} символов
                </span>
                {errors.wish ? <span className="field-error">{errors.wish}</span> : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="builder-step">
              <h2>Проверьте заказ</h2>
              <p className="builder-step__lead">
                Так будет выглядеть ваш заказ. После оплаты книга создаётся автоматически, а ссылка придёт на почту.
              </p>

              <div className="table-like" style={{ marginBottom: 20 }}>
                {reviewRows.map((row) => (
                  <div key={row.label}>
                    <span style={{ color: "var(--muted)" }}>{row.label}</span>
                    <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <strong style={{ fontWeight: 700 }}>{row.value}</strong>
                      <button
                        type="button"
                        className="btn btn--quiet"
                        style={{ padding: 0, fontSize: 11 }}
                        onClick={() => setStep(row.step)}
                      >
                        изменить
                      </button>
                    </span>
                  </div>
                ))}
                {draft.extraDetails.trim() ? (
                  <div>
                    <span style={{ color: "var(--muted)" }}>Детали</span>
                    <span style={{ maxWidth: 320, textAlign: "right" }}>{draft.extraDetails.trim()}</span>
                  </div>
                ) : null}
                {draft.wish.trim() ? (
                  <div>
                    <span style={{ color: "var(--muted)" }}>Пожелание</span>
                    <span style={{ maxWidth: 320, textAlign: "right" }}>{draft.wish.trim()}</span>
                  </div>
                ) : null}
                <div>
                  <span style={{ color: "var(--muted)" }}>Формат</span>
                  <strong>PDF: обложка, 9 глав, иллюстрации, письмо</strong>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Цена</span>
                  <strong>{price}</strong>
                </div>
              </div>

              <div className="field">
                <label htmlFor="order-email">Электронная почта *</label>
                <input
                  id="order-email"
                  className="input"
                  type="email"
                  inputMode="email"
                  maxLength={120}
                  value={draft.email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(event) => update("email", event.target.value)}
                />
                <span className="field-hint">На этот адрес придёт ссылка на заказ и готовый PDF. Мы не рассылаем рекламу.</span>
                {errors.email ? <span className="field-error">{errors.email}</span> : null}
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={draft.consent}
                  onChange={(event) => update("consent", event.target.checked)}
                />
                <span>
                  Я согласен(на) на обработку перечисленных данных для создания персональной сказки. Данные можно
                  удалить со страницы заказа в любой момент.{" "}
                  <Link href="/legal/consent" style={{ color: "var(--blue)" }}>
                    Подробные условия
                  </Link>
                  .
                </span>
              </label>
              {errors.consent ? <span className="field-error">{errors.consent}</span> : null}

              <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
                <label htmlFor="order-company">Название компании</label>
                <input
                  id="order-company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                />
              </div>

              {serverError ? (
                <div className="notice notice--danger" role="alert" style={{ marginTop: 16 }}>
                  <span aria-hidden="true">!</span>
                  <span>{serverError}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="builder-actions">
            {step > 0 ? (
              <button type="button" className="btn btn--ghost" onClick={() => goToStep((step - 1) as 0 | 1)}>
                ← Назад
              </button>
            ) : (
              <Link className="btn btn--ghost" href="/">
                ← На главную
              </Link>
            )}

            {step < 2 ? (
              <button type="button" className="btn btn--blue" onClick={() => goToStep((step + 1) as 1 | 2)}>
                Продолжить →
              </button>
            ) : (
              <button type="submit" className="btn btn--primary" disabled={submitting || !generationAvailable}>
                {submitting ? "Создаём заказ…" : "Перейти к оплате " + price}
              </button>
            )}
          </div>
        </form>
      </div>

      <aside className="summary-card" aria-label="Итог заказа">
        <h3>Ваш заказ</h3>
        <div className="summary-cover">
          <div className="summary-cover__title">
            Моя
            <br />
            сказка
          </div>
          <div className="summary-cover__name">{displayName} · личная сказка</div>
        </div>
        <dl>
          <div>
            <dt>Герой</dt>
            <dd>{draft.childName.trim() || "—"}</dd>
          </div>
          <div>
            <dt>Возраст</dt>
            <dd>{draft.childAge} лет</dd>
          </div>
          <div>
            <dt>Тематика</dt>
            <dd>{theme.label}</dd>
          </div>
          <div>
            <dt>Характер</dt>
            <dd>{mood.label}</dd>
          </div>
          <div>
            <dt>Формат</dt>
            <dd>PDF-книга</dd>
          </div>
        </dl>
        <div className="summary-card__price">
          <span>Итого</span>
          <strong>{price}</strong>
        </div>
        <p className="summary-card__note">
          Оплата — на следующем шаге. До оплаты вы ещё раз увидите состав заказа. Черновик ответов сохраняется только
          в этом браузере.
        </p>
      </aside>
    </div>
  );
};
