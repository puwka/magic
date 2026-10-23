import sharp from "sharp";
import type { GeneratedImage, ImageGenerationRequest, ImageProvider } from "@/lib/generation/image-provider";
import { createSceneSvg } from "@/lib/illustration/scenes";

export class LocalIllustrationProvider implements ImageProvider {
  readonly id = "local-svg-illustrator";

  async generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const label =
      request.kind === "cover"
        ? "Обложка сказки «" + request.storyTitle + "»"
        : request.alt;

    const svg = createSceneSvg({
      kind: request.scene,
      seed: request.seed,
      label,
    });

    const data = await sharp(Buffer.from(svg, "utf8"))
      .resize(1600, 1100, { fit: "cover" })
      .jpeg({ quality: 88, chromaSubsampling: "4:4:4", progressive: true })
      .toBuffer();

    return {
      data,
      mimeType: "image/jpeg",
      provider: this.id,
    };
  }
}
