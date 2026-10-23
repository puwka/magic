import Link from "next/link";

export const Hero = () => {
  return (
    <>
      <div className="announcement">
        <b>●</b> Персональная сказка в PDF · без регистрации и фотографий <b>—</b> сначала проверьте заказ
      </div>
      <div className="shell">
        <section className="hero">
          <div className="hero__copy">
            <div className="eyebrow">
              <span className="eyebrow__mark" aria-hidden="true">
                ✳
              </span>
              Иллюстрированная сказка · PDF
            </div>
            <h1>
              Не шаблон.
              <br />
              <em>История про вашего героя.</em>
            </h1>
            <p className="hero__lead">
              Сказка, собранная вокруг конкретного ребёнка: его имя, возраст, увлечения и маленькие детали, которые
              делают историю личной.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--primary" href="/create">
                Создать сказку <span aria-hidden="true">↗</span>
              </Link>
              <a className="view-all" href="#preview">
                Посмотреть примеры
              </a>
            </div>
            <div className="hero__meta">
              <span className="meta-item">
                <span className="mini-check" aria-hidden="true">
                  ✓
                </span>
                Проверка заказа до оплаты
              </span>
              <span className="meta-item">
                <span className="mini-check" aria-hidden="true">
                  ✓
                </span>
                Готовая книга за минуты
              </span>
            </div>
          </div>
          <div className="hero__art">
            <div className="art-note">
              <b>01</b> ПЕРСОНАЛЬНАЯ СКАЗКА
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hero__product"
              src="/images/hero-product.png"
              alt="Объёмная книга-сказка с иллюстрациями"
              width={1400}
              height={1000}
            />
            <div className="art-sticker">
              Имя, детали
              <br />
              и любимые герои — внутри.
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
