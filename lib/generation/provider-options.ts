import { getAppConfig } from "@/lib/config";
import { DemoTextProvider } from "@/lib/generation/demo-text-provider";
import { createOpenAITextProvider } from "@/lib/generation/openai-text-provider";
import type { TextProvider } from "@/lib/generation/text-provider";

export const getTextProvider = (options: { forceDemo?: boolean } = {}): TextProvider => {
  const config = getAppConfig();

  if (options.forceDemo || config.demoMode) {
    if (config.appEnv === "production") {
      throw new Error("Demo generation is not allowed in production.");
    }
    return new DemoTextProvider();
  }

  if (!config.ai.textConfigured) {
    throw new Error("Text generation is not configured. Set AI_TEXT_BASE_URL, AI_TEXT_API_KEY and AI_TEXT_MODEL.");
  }

  return createOpenAITextProvider();
};
