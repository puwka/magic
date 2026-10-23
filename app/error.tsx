"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[magia] Page error", error);
  }, [error]);

  return (
    <div className="shell">
      <div className="page-hero">
        <div className="section-kicker">Ошибка</div>
        <h1>
          Что-то пошло <em>не так</em>
        </h1>
        <p>
          Страница не открылась. Попробуйте обновить её — если ошибка повторяется, напишите в поддержку и укажите
          номер заказа.
        </p>
      </div>
      <div className="row">
        <button type="button" className="btn btn--primary" onClick={reset}>
          Попробовать снова
        </button>
        <Link className="btn btn--ghost" href="/">
          На главную
        </Link>
        <Link className="btn btn--ghost" href="/recover">
          Найти заказ
        </Link>
      </div>
    </div>
  );
}
