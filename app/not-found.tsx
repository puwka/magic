import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell">
      <div className="page-hero">
        <div className="section-kicker">404</div>
        <h1>
          Такой страницы <em>нет</em>
        </h1>
        <p>
          Возможно, ссылка устарела или в адресе опечатка. Заказ открывается по личной ссылке — её можно восстановить
          по номеру заказа и почте.
        </p>
      </div>
      <div className="row">
        <Link className="btn btn--primary" href="/create">
          Создать сказку
        </Link>
        <Link className="btn btn--ghost" href="/recover">
          Восстановить доступ к заказу
        </Link>
      </div>
    </div>
  );
}
