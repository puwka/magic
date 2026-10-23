import type { Metadata } from "next";
import { PayView } from "@/components/pay-view";
import { getAppConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Оплата заказа",
  description: "Подтверждение оплаты заказа персональной сказки.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function PayPage({ params }: PageProps) {
  const { id } = await params;
  const config = getAppConfig();

  return (
    <div className="shell">
      <PayView orderId={id} supportEmail={config.supportEmail} />
    </div>
  );
}
