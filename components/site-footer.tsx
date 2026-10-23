import Link from "next/link";

const links = [
  { href: "/legal/privacy", label: "Политика данных" },
  { href: "/legal/consent", label: "Согласие" },
  { href: "/legal/terms", label: "Условия сервиса" },
  { href: "/legal/requisites", label: "Реквизиты" },
  { href: "/recover", label: "Найти заказ" },
];

export const SiteFooter = () => {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <span>© 2026 Магия · подарки с историей · цифровая книга в PDF</span>
        <div className="site-footer__links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};
