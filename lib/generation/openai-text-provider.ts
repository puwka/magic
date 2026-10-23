import { getAppConfig } from "@/lib/config";
import { buildStoryUserPrompt, STORY_SYSTEM_PROMPT } from "@/lib/generation/prompts";
import { parseAndSanitizeStory } from "@/lib/generation/sanitize";
import type { TextGenerationRequest, TextProvider } from "@/lib/generation/text-provider";
import type { StoryBook } from "@/lib/generation/types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
};

const normalizeBase = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");

const completionUrl = (baseUrl: string) => {
  const base = normalizeBase(baseUrl);
  if (base.endsWith("/chat/completions")) return base;
  return base + "/chat/completions";
};

const messageContent = (response: ChatCompletionResponse) => {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part.text ?? "").join("");
  return "";
};

export class OpenAITextProvider implements TextProvider {
  readonly id: string;
  readonly isDemo = false;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: { baseUrl: string; apiKey: string; model: string; timeoutMs: number }) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
    this.id = "openai-compatible:" + options.model;
  }

  async generate(request: TextGenerationRequest, parentSignal?: AbortSignal): Promise<StoryBook> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const timeout = AbortSignal.timeout(this.timeoutMs);
      const signal = parentSignal ? AbortSignal.any([parentSignal, timeout]) : timeout;

      try {
        const response = await fetch(completionUrl(this.baseUrl), {
          method: "POST",
          headers: {
            Authorization: "Bearer " + this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            temperature: attempt === 0 ? 0.8 : 0.65,
            max_tokens: 7000,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: STORY_SYSTEM_PROMPT },
              {
                role: "user",
                content:
                  buildStoryUserPrompt(request) +
                  (attempt > 0
                    ? "\nПредыдущий ответ был неполным или нарушал структуру. Верни корректный JSON строго по схеме."
                    : ""),
              },
            ],
          }),
          signal,
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error("Text provider responded with " + response.status + (text ? ": " + text.slice(0, 300) : ""));
        }

        const data = (await response.json()) as ChatCompletionResponse;
        const content = messageContent(data);
        if (!content) throw new Error(data.error?.message ?? "Text provider returned an empty response.");

        const result = parseAndSanitizeStory(content, request.childName);
        return result.story;
      } catch (error) {
        lastError = error;
        if (parentSignal?.aborted) throw error;
        if (attempt === 0) {
          console.warn("[magia] Text generation attempt failed; retrying once", error instanceof Error ? error.message : error);
        }
      }
    }

    throw new Error(
      "Text generation failed after two attempts: " + (lastError instanceof Error ? lastError.message : "unknown error"),
    );
  }
}

export const createOpenAITextProvider = () => {
  const config = getAppConfig();
  if (!config.ai.textConfigured) {
    throw new Error("Text generation provider is not configured.");
  }
  return new OpenAITextProvider({
    baseUrl: config.ai.textBaseUrl,
    apiKey: config.ai.textApiKey,
    model: config.ai.textModel,
    timeoutMs: config.ai.textTimeoutMs,
  });
};
