import { getAppConfig, isGenerationAvailable, isTestPaymentAllowed } from "@/lib/config";
import { CONSENT_VERSION } from "@/lib/validation/order";
import { AGE_OPTIONS, INTEREST_OPTIONS, MOODS, THEMES } from "@/lib/content/options";
import { noStoreJson } from "@/lib/api/guard";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const config = getAppConfig();
  return noStoreJson({
    ok: true,
    priceRub: config.priceRub,
    currency: config.currency,
    demoMode: config.demoMode,
    generationAvailable: isGenerationAvailable(config),
    testPaymentEnabled: isTestPaymentAllowed(config),
    consentVersion: CONSENT_VERSION,
    supportEmail: config.supportEmail,
    options: {
      ages: AGE_OPTIONS,
      interests: INTEREST_OPTIONS,
      themes: THEMES.map((theme) => ({ id: theme.id, label: theme.label, short: theme.short })),
      moods: MOODS.map((mood) => ({ id: mood.id, label: mood.label, description: mood.description })),
    },
  });
};
