import type { SceneKind } from "@/lib/illustration/scenes";

export type ImageGenerationRequest = {
  kind: "cover" | "scene";
  prompt: string;
  alt: string;
  seed: number;
  scene: SceneKind;
  childAge: number;
  storyTitle: string;
};

export type GeneratedImage = {
  data: Buffer;
  mimeType: "image/jpeg" | "image/png";
  provider: string;
};

export interface ImageProvider {
  readonly id: string;
  generateImage(request: ImageGenerationRequest): Promise<GeneratedImage>;
}
