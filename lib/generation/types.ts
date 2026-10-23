import { z } from "zod";

export const chapterSchema = z.object({
  title: z.string().min(2).max(90),
  text: z.string().min(220).max(1100),
});

export const illustrationSceneSchema = z.object({
  chapterIndex: z.number().int().min(0).max(9),
  alt: z.string().min(4).max(180),
  prompt: z.string().min(20).max(1500),
});

export const storyBookSchema = z.object({
  title: z.string().min(3).max(90),
  subtitle: z.string().min(3).max(140),
  dedication: z.string().min(10).max(260),
  chapters: z.array(chapterSchema).min(8).max(10),
  illustrationScenes: z.array(illustrationSceneSchema).min(3).max(5),
  coverPrompt: z.string().min(20).max(1500),
  letter: z.string().min(80).max(1400),
  closingLine: z.string().min(5).max(180),
});

export type StoryBook = z.infer<typeof storyBookSchema>;
export type IllustrationScene = z.infer<typeof illustrationSceneSchema>;

export type GeneratedIllustration = {
  key: string;
  storageKey: string;
  kind: "cover" | "scene";
  chapterIndex?: number;
  alt: string;
  provider: string;
  mimeType: "image/jpeg" | "image/png";
};

export type GenerationResult = {
  story: StoryBook;
  cover: GeneratedIllustration;
  illustrations: GeneratedIllustration[];
  templateVersion: string;
  createdAt: string;
  isDemo: boolean;
  providers: {
    text: string;
    images: string;
  };
  warnings: string[];
};

export const GENERATION_STEPS = [
  { id: "queued", label: "Заказ принят" },
  { id: "story", label: "Пишем историю" },
  { id: "cover", label: "Рисуем обложку" },
  { id: "illustrations", label: "Создаём иллюстрации" },
  { id: "pdf", label: "Собираем книгу" },
  { id: "email", label: "Готовим доставку" },
] as const;

export type GenerationStep = (typeof GENERATION_STEPS)[number]["id"];
