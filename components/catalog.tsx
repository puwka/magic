import Link from "next/link";

const products = [
  {
    id: "01",
    tone: "story",
    kicker: "01 / Для маленьких и больших",
    title: (
      <>
        Сказка,
        <br />
        где герой — он
      </>
    ),
    text: "Иллюстрированная история с именем, характером и любимыми деталями. Доступна сейчас.",
    action: { kind: "link" as const, href: "/create", label: "Собрать сказку ↗" },
    art: (
      <div className="mini-book">
        <div className="mini-book__landscape" />
        <div className="mini-book__title">
          Моя
          <br />
          сказка
        </div>
      </div>
    ),
  },
  {
    id: "02",
    tone: "letter",
    kicker: "02 / Для сюрприза",
    title: (
      <>
        Письма
        <br />
        и квесты
      </>
    ),
    text: "Тайное послание, загадки и домашнее приключение.",
    action: { kind: "soon" as const, label: "Скоро" },
    art: (
      <div className="mini-letter">
        Для тебя
        <br />
        <span aria-hidden="true">✦</span>
      </div>
    ),
  },
  {
    id: "03",
    tone: "video",
    kicker: "03 / Для эмоций",
    title: (
      <>
        Видео
        <br />
        поздравления
      </>
    ),
    text: "Персональное обращение и ваши общие детали.",
    action: { kind: "soon" as const, label: "Скоро" },
    art: (
      <div className="mini-screen">
        <span aria-hidden="true">▶</span>
      </div>
    ),
  },
  {
    id: "04",
    tone: "photo",
    kicker: "04 / Для образа",
    title: (
      <>
        AI-фотосессии
      </>
    ),
    text: "Новый образ, семейная история или фото с питомцем.",
    action: { kind: "soon" as const, label: "Скоро" },
    art: (
      <>
        <div className="mini-photo mini-photo--one" />
        <div className="mini-photo mini-photo--two" />
      </>
    ),
  },
  {
    id: "05",
    tone: "cards",
    kicker: "05 / Для близких",
    title: (
      <>
        Открытки
        <br />
        со смыслом
      </>
    ),
    text: "Один адресат — одно точное поздравление.",
    action: { kind: "soon" as const, label: "Скоро" },
    art: (
      <div className="mini-greeting">
        <span>С теплом</span>
        <i aria-hidden="true">✳</i>
        <b>для тебя</b>
      </div>
    ),
  },
];

export const Catalog = () => {
  return (
    <section className="section" id="catalog">
      <div className="section-head">
        <div>
          <div className="section-kicker">Коллекция «Магия»</div>
          <h2>
            Выберите свой <em>формат</em>
          </h2>
        </div>
        <a className="view-all" href="#finder">
          Подобрать формат ↗
        </a>
      </div>
      <div className="products">
        {products.map((product) => (
          <article
            key={product.id}
            className={
              "product product--" + product.tone + (product.action.kind === "soon" ? " product--soon" : "")
            }
          >
            <div className="product__num">{product.kicker}</div>
            <h3>{product.title}</h3>
            <p>{product.text}</p>
            {product.action.kind === "link" ? (
              <Link className="product__link" href={product.action.href}>
                {product.action.label}
              </Link>
            ) : (
              <span className="product__link">{product.action.label}</span>
            )}
            <div className="product__art" aria-hidden="true">
              {product.art}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
