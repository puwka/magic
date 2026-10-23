"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AGE_OPTIONS, INTEREST_OPTIONS, THEMES } from "@/lib/content/options";

const DEFAULT_NAME = "Аня";
const PREVIEW_INTEREST_LIMIT = 3;

const themeSlug: Record<string, string> = {
  forest: "lunny-sad",
  cosmos: "polyarnaya-zvezda",
  ocean: "more-sheptom",
  dinosaurs: "lunny-sad",
  mountains: "lunny-sad",
  city: "polyarnaya-zvezda",
};

export const PersonalPreview = () => {
  const [name, setName] = useState(DEFAULT_NAME);
  const [age, setAge] = useState(6);
  const [theme, setTheme] = useState<string>("forest");
  const [interests, setInterests] = useState<string[]>(["space", "animals"]);

  const displayName = name.trim() || "ваш герой";
  const selectedTheme = THEMES.find((item) => item.id === theme) ?? THEMES[1];
  const interestLabels = useMemo(
    () =>
      interests
        .map((id) => INTEREST_OPTIONS.find((option) => option.id === id)?.label)
        .filter((label) => label !== undefined),
    [interests],
  );

  const toggleInterest = (id: string) => {
    setInterests((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= PREVIEW_INTEREST_LIMIT) return current;
      return [...current, id];
    });
  };

  const scrollToPreview = () => {
    document.querySelector("#preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <section id="finder" className="section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Не знаете, с чего начать?</div>
            <h2>
              Начнём с <em>героя</em>
            </h2>
          </div>
          <a className="view-all" href="#catalog">
            Все форматы ↗
          </a>
        </div>
        <div className="finder">
          <div className="finder__intro">
            <h2>Пусть сказка сразу обращается по имени.</h2>
            <p>
              Попробуйте прямо здесь. Это бесплатный пример: регистрация, фотографии и оплата не нужны — просто
              посмотрите, как имя и детали меняют историю.
            </p>
            <div className="finder__assurance">
              <span>✓ Можно изменить детали</span>
              <span>✓ Проверка заказа до оплаты</span>
            </div>
          </div>
          <div className="finder__card">
            <div className="finder__card-top">
              <strong>Создадим первый набросок</strong>
              <span className="step-badge">Предпросмотр</span>
            </div>
            <div className="builder-layout">
              <div>
                <div className="field">
                  <label htmlFor="preview-name">Как зовут героя сказки?</label>
                  <input
                    id="preview-name"
                    className="input"
                    type="text"
                    maxLength={30}
                    value={name}
                    placeholder="Например, Маша"
                    autoComplete="off"
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="field">
                  <span className="field-label">Сколько лет?</span>
                  <div className="chips">
                    {AGE_OPTIONS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="chip chip--square"
                        aria-pressed={age === value}
                        onClick={() => setAge(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="field-label">Тематика истории</span>
                  <div className="chips">
                    {THEMES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="chip"
                        aria-pressed={theme === item.id}
                        onClick={() => setTheme(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="field-label">Что любит герой? До {PREVIEW_INTEREST_LIMIT} увлечений</span>
                  <div className="chips">
                    {INTEREST_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="chip"
                        aria-pressed={interests.includes(item.id)}
                        onClick={() => toggleInterest(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="spread" style={{ marginTop: 18 }}>
                  <span className="small">Можно посмотреть перед оплатой</span>
                  <button type="button" className="btn btn--blue btn--small" onClick={scrollToPreview}>
                    Показать пример ↗
                  </button>
                </div>
              </div>
              <div className="live-preview" aria-live="polite">
                <div className="live-preview__top">
                  <span>Ваш подарок</span>
                  <span className="live-status">
                    <i aria-hidden="true" /> ПРИМЕР
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
                    <img src={"/images/themes/" + selectedTheme.id + ".jpg"} alt="" />
                  </div>
                  <div className="live-book__name">{displayName} · личная сказка</div>
                </div>
                <div className="live-caption">
                  <strong>История, в которой {displayName} — в главной роли</strong>
                  <span>
                    {selectedTheme.label} · {age} лет ·{" "}
                    {interestLabels.length ? interestLabels.join(", ") : "любимые увлечения"}
                  </span>
                </div>
                <div className="live-preview__foot">
                  <span aria-hidden="true">✦</span> Имя и детали появятся внутри истории
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="preview-panel" id="preview">
        <div className="preview-panel__copy">
          <div className="section-kicker">Сначала посмотрите</div>
          <h2>
            Не верьте на слово.
            <br />
            <em>Загляните внутрь.</em>
          </h2>
          <p>
            Вот фрагмент готовой истории: цельный сюжет, единый стиль иллюстраций и детали, которые делают сказку
            личной. В этом примере героя зовут {displayName}.
          </p>
          <Link className="btn btn--primary btn--small" href="/create">
            Собрать такую сказку ↗
          </Link>
        </div>
        <div className="preview-pages">
          <article className="preview-page">
            <span className="gallery__page-label">Фрагмент · страница 01</span>
            <h3>
              В ту ночь {displayName} замечает <em>свет за окном…</em>
            </h3>
            <p className="gallery__page-copy">
              Снег ложится на крыши, часы бьют девять, а на подоконнике лежит карта. Кажется, её оставили
              специально для тебя, {displayName}.
            </p>
            <div className="gallery__art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={"/images/themes/" + selectedTheme.id + ".jpg"}
                alt={"Иллюстрация в тематике «" + selectedTheme.label + "»"}
              />
            </div>
          </article>
          <article className="preview-page preview-page--second">
            <span className="gallery__page-label">Страница 02 / 12</span>
            <h3>Каждая звезда знает, что {displayName} уже в пути</h3>
            <p className="gallery__page-copy">
              Первый шаг — и город зажигается огнями: приключение начинается прямо сейчас. Осталось только открыть
              первую страницу.
            </p>
            <div className="gallery__art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={"/images/examples/" + (themeSlug[selectedTheme.id] ?? "lunny-sad") + "-2.jpg"}
                alt="Иллюстрация к сказке"
              />
            </div>
          </article>
        </div>
      </section>
    </>
  );
};
