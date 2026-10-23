import Link from "next/link";

export const ResultSection = () => {
  return (
    <section className="section proof-sample">
      <div className="sample-image">
        <div className="poster">
          <div className="poster-top">
            Для тебя,
            <br />
            с теплом и звёздами.
          </div>
          <div className="poster-lines" />
          <div className="poster-lines" style={{ width: "48%" }} />
          <div className="poster-art" />
        </div>
      </div>
      <div className="sample-copy">
        <div className="section-kicker">Что вы получите</div>
        <h2>
          Из идеи — в готовую <em>книгу.</em>
        </h2>
        <p>
          В конце вы получаете PDF-книгу: обложка, девять глав с иллюстрациями, завершающий разворот и письмо с
          поздравлением. Файл можно скачать, распечатать или отправить близкому.
        </p>
        <div className="sample-points">
          <span>
            <b>✓</b> Уникальный текст
          </span>
          <span>
            <b>✓</b> 4–5 иллюстраций
          </span>
          <span>
            <b>✓</b> Личные детали
          </span>
        </div>
        <Link className="btn btn--ghost btn--small" href="/create">
          Начать с героя ↗
        </Link>
      </div>
    </section>
  );
};
