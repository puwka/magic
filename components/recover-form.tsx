"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/client/api";

export const RecoverForm = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await apiRequest<{ message: string }>("/api/orders/recover", {
      method: "POST",
      body: { orderNumber: orderNumber.trim().toUpperCase(), email: email.trim().toLowerCase() },
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setMessage(result.data.message);
  };

  return (
    <div className="builder-panel" style={{ maxWidth: 620 }}>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="recover-number">Номер заказа</label>
          <input
            id="recover-number"
            className="input mono"
            type="text"
            maxLength={20}
            value={orderNumber}
            placeholder="MG-2026-A1B2C3"
            autoComplete="off"
            onChange={(event) => setOrderNumber(event.target.value)}
          />
          <span className="field-hint">Номер указан в письме и на странице заказа — например, MG-2026-A1B2C3.</span>
        </div>
        <div className="field">
          <label htmlFor="recover-email">Электронная почта из заказа</label>
          <input
            id="recover-email"
            className="input"
            type="email"
            maxLength={120}
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        {error ? (
          <div className="notice notice--danger" style={{ marginBottom: 14 }}>
            <span aria-hidden="true">!</span>
            <span>{error}</span>
          </div>
        ) : null}

        {message ? (
          <div className="notice notice--success" style={{ marginBottom: 14 }}>
            <span aria-hidden="true">✓</span>
            <span>{message}</span>
          </div>
        ) : null}

        <button type="submit" className="btn btn--blue btn--wide" disabled={busy}>
          {busy ? "Отправляем…" : "Отправить личную ссылку"}
        </button>
      </form>
    </div>
  );
};
