const steps = [
  {
    title: "Расскажите о герое",
    text: "Имя, возраст, увлечения и пара тёплых деталей — этого достаточно, чтобы история стала личной.",
  },
  {
    title: "Проверьте заказ",
    text: "До оплаты вы видите состав заказа и адрес, на который придёт готовая книга. Никаких скрытых пунктов.",
  },
  {
    title: "Получите книгу",
    text: "PDF с обложкой, иллюстрациями, девятью главами и письмом-поздравлением. Скачайте, распечатайте или отправьте.",
  },
];

export const Steps = () => {
  return (
    <section className="section" id="how">
      <div className="section-head">
        <div>
          <div className="section-kicker">Как это работает</div>
          <h2>
            Три шага — и <em>сказка готова</em>
          </h2>
        </div>
      </div>
      <div className="steps">
        {steps.map((step, index) => (
          <article className="step-card" key={step.title}>
            <div className="step-card__num" aria-hidden="true">
              {index + 1}
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
