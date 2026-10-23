import { getAppConfig } from "@/lib/config";
import type { ImageProvider } from "@/lib/generation/image-provider";
import { LocalIllustrationProvider } from "@/lib/generation/local-image-provider";
import { createOpenAIImageProvider } from "@/lib/generation/openai-image-provider";

export const getImageProvider = (): { provider: ImageProvider; warning: string | null } => {
  const config = getAppConfig();
  const looksConfigured = Boolean(config.ai.imageApiKey && config.ai.imageModel && config.ai.imageBaseUrl);

  if (config.ai.imageProvider === "openai" && looksConfigured) {
    return { provider: createOpenAIImageProvider(), warning: null };
  }

  return {
    provider: new LocalIllustrationProvider(),
    warning:
      config.ai.imageProvider === "openai" && !looksConfigured
        ? "Внешний сервис иллюстраций не настроен. Использован встроенный иллюстратор «Магии»."
        : null,
  };
};
