import type { Metadata } from "next";
import { OrderView } from "@/components/order-view";
import { getAppConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Мой заказ",
  description: "Статус создания персональной сказки, оплата и готовая книга.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  const config = getAppConfig();

  return (
    <div className="shell">
      <OrderView orderId={id} supportEmail={config.supportEmail} />
    </div>
  );
}
