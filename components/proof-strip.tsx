const items = [
  { icon: "⌁", title: "Не шаблон", text: "Имя и детали внутри истории" },
  { icon: "◉", title: "Сначала проверка", text: "Состав заказа виден до оплаты" },
  { icon: "↗", title: "Готово онлайн", text: "PDF без ожидания доставки" },
  { icon: "♡", title: "Можно сохранить", text: "Скачать, распечатать, отправить" },
];

export const ProofStrip = () => {
  return (
    <div className="proof-strip">
      {items.map((item) => (
        <div className="proof" key={item.title}>
          <span className="proof__icon" aria-hidden="true">
            {item.icon}
          </span>
          <div>
            <strong>{item.title}</strong>
            <small>{item.text}</small>
          </div>
        </div>
      ))}
    </div>
  );
};
