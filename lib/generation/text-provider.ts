import type { GenerationStep, StoryBook } from "@/lib/generation/types";
import type { StoryDataInput } from "@/lib/validation/order";

export type TextGenerationRequest = Pick<
  StoryDataInput,
  "childName" | "childAge" | "interests" | "extraDetails" | "theme" | "mood" | "wish"
>;

export interface TextProvider {
  readonly id: string;
  readonly isDemo: boolean;
  generate(request: TextGenerationRequest, signal?: AbortSignal): Promise<StoryBook>;
}

export type GeneratedText = {
  story: StoryBook;
  provider: string;
  isDemo: boolean;
  warnings: string[];
};

export type GenerationProgress = (step: GenerationStep, message?: string) => Promise<void> | void;
