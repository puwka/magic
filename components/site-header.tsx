import Link from "next/link";

const navLinks = [
  { href: "/#catalog", label: "Каталог" },
  { href: "/#preview", label: "Примеры" },
  { href: "/#how", label: "Как работает" },
  { href: "/recover", label: "Мой заказ" },
];

export const SiteHeader = () => {
  return (
    <header className="site-header">
      <div className="shell">
        <div className="site-header__inner">
          <Link className="brand" href="/" aria-label="Магия — на главную">
            <span className="brand__mark" aria-hidden="true">
              ✳
            </span>
            <span>
              <span className="brand__name">магия</span>
              <span className="brand__sub">подарки с историей</span>
            </span>
          </Link>

          <nav className="site-nav" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link className="header-cta" href="/create">
              Создать сказку ↗
            </Link>
            <details className="mobile-menu">
              <summary className="header-cta" aria-label="Открыть меню">
                Меню
              </summary>
              <div className="mobile-menu__panel">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
                <Link href="/create">Создать сказку</Link>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
};
