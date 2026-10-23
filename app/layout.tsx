import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Магия — персональная иллюстрированная сказка",
    template: "%s · Магия",
  },
  description:
    "Персональная иллюстрированная сказка: имя ребёнка, возраст, увлечения и любимые детали внутри истории. Готовая книга в PDF — за несколько минут.",
  applicationName: "Магия",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Магия",
    title: "Магия — персональная иллюстрированная сказка",
    description:
      "Расскажите о ребёнке — мы соберём иллюстрированную сказку с его именем, характером и любимыми деталями.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#19233f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="resume-shell">
          <SiteHeader />
          <main className="resume-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
