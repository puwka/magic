import sharp from "sharp";
import { getAppConfig } from "@/lib/config";
import { buildCoverImagePrompt, buildSceneImagePrompt } from "@/lib/generation/prompts";
import type { GeneratedImage, ImageGenerationRequest, ImageProvider } from "@/lib/generation/image-provider";

type ImageApiResponse = {
  data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
  error?: { message?: string };
};

const normalizeBase = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");

const generationsUrl = (baseUrl: string) => {
  const base = normalizeBase(baseUrl);
  if (base.endsWith("/images/generations")) return base;
  return base + "/images/generations";
};

const safePrompt = (request: ImageGenerationRequest) => {
  const prompt =
    request.kind === "cover"
      ? buildCoverImagePrompt(request.storyTitle, request.prompt, request.childAge)
      : buildSceneImagePrompt(request.prompt, request.childAge);

  return prompt + "; avoid any readable text or lettering in the final image.";
};

export class OpenAIImageProvider implements ImageProvider {
  readonly id: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly size: string;
  private readonly timeoutMs: number;

  constructor(options: { baseUrl: string; apiKey: string; model: string; size: string; timeoutMs: number }) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.size = options.size;
    this.timeoutMs = options.timeoutMs;
    this.id = "openai-compatible:" + options.model;
  }

  async generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const response = await fetch(generationsUrl(this.baseUrl), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: safePrompt(request),
        n: 1,
        size: this.size,
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const payload = (await response.json()) as ImageApiResponse;
    if (!response.ok) {
      throw new Error("Image provider responded with " + response.status + ": " + (payload.error?.message ?? "unknown error"));
    }

    const first = payload.data?.[0];
    if (!first) throw new Error("Image provider returned no image.");

    let source: Buffer;
    if (first.b64_json) {
      source = Buffer.from(first.b64_json, "base64");
    } else if (first.url) {
      const imageResponse = await fetch(first.url, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!imageResponse.ok) throw new Error("Could not download generated image.");
      source = Buffer.from(await imageResponse.arrayBuffer());
    } else {
      throw new Error("Image provider returned neither base64 nor URL.");
    }

    if (source.byteLength > 20 * 1024 * 1024) {
      throw new Error("Generated image is too large.");
    }

    const normalized = await sharp(source)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88, chromaSubsampling: "4:4:4", progressive: true })
      .toBuffer();

    return {
      data: normalized,
      mimeType: "image/jpeg",
      provider: this.id,
    };
  }
}

export const createOpenAIImageProvider = () => {
  const config = getAppConfig();
  if (!config.ai.imageApiKey || !config.ai.imageModel || !config.ai.imageBaseUrl) {
    throw new Error("Image generation provider is not configured.");
  }
  return new OpenAIImageProvider({
    baseUrl: config.ai.imageBaseUrl,
    apiKey: config.ai.imageApiKey,
    model: config.ai.imageModel,
    size: config.ai.imageSize,
    timeoutMs: config.ai.imageTimeoutMs,
  });
};
