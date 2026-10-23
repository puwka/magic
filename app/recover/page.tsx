import type { Metadata } from "next";
import { RecoverForm } from "@/components/recover-form";

export const metadata: Metadata = {
  title: "Найти заказ",
  description: "Восстановите личную ссылку на заказ по номеру и электронной почте.",
};

export const dynamic = "force-dynamic";

export default function RecoverPage() {
  return (
    <div className="shell">
      <div className="page-hero">
        <div className="section-kicker">Личная ссылка</div>
        <h1>
          Найти <em>свой заказ</em>
        </h1>
        <p>
          Заказы защищены личными ссылками: мы не показываем содержимое по одному номеру. Укажите номер заказа и
          почту — мы отправим на неё ссылку для доступа.
        </p>
      </div>
      <RecoverForm />
    </div>
  );
}
