import type { Metadata } from "next";
import { OrderBuilder } from "@/components/order-builder";
import { getAppConfig, isGenerationAvailable } from "@/lib/config";
import { CONSENT_VERSION } from "@/lib/validation/order";

export const metadata: Metadata = {
  title: "Конструктор персональной сказки",
  description:
    "Три коротких шага: расскажите о ребёнке, выберите тематику и проверьте заказ. Регистрация и фотографии не нужны.",
};

export const dynamic = "force-dynamic";

export default function CreatePage() {
  const config = getAppConfig();

  return (
    <div className="shell">
      <div className="page-hero">
        <div className="section-kicker">Конструктор сказки</div>
        <h1>
          Соберём историю <em>вместе</em>
        </h1>
        <p>
          Три коротких шага: герой, сюжет и проверка заказа. Регистрация не нужна, фотографии не понадобятся — только
          имя, возраст и то, что вы захотите рассказать.
        </p>
      </div>
      <OrderBuilder
        priceRub={config.priceRub}
        demoMode={config.demoMode}
        generationAvailable={isGenerationAvailable(config)}
        supportEmail={config.supportEmail}
        consentVersion={CONSENT_VERSION}
      />
    </div>
  );
}
