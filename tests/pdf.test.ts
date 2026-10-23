import { beforeAll, describe, expect, it } from "vitest";
import { buildBookPdf } from "@/lib/pdf/build-book";
import { DemoTextProvider } from "@/lib/generation/demo-text-provider";
import { LocalIllustrationProvider } from "@/lib/generation/local-image-provider";
import type { GeneratedIllustration, StoryBook } from "@/lib/generation/types";
import type { SceneKind } from "@/lib/illustration/scenes";
import { makeOrder } from "./factories";

const buildTestBook = async () => {
  const order = makeOrder();
  const story = await new DemoTextProvider().generate({
    childName: order.input.childName,
    childAge: order.input.childAge,
    interests: order.input.interests,
    extraDetails: order.input.extraDetails,
    theme: order.input.theme,
    mood: order.input.mood,
    wish: order.input.wish,
  });

  const illustrator = new LocalIllustrationProvider();
  const coverImage = await illustrator.generateImage({
    kind: "cover",
    prompt: story.coverPrompt,
    alt: "Обложка",
    seed: 11,
    scene: "cosmos",
    childAge: order.input.childAge,
    storyTitle: story.title,
  });

  const sceneImages = await Promise.all(
    story.illustrationScenes.map((scene, index) =>
      illustrator.generateImage({
        kind: "scene",
        prompt: scene.prompt,
        alt: scene.alt,
        seed: 100 + index,
        scene: "cosmos" as SceneKind,
        childAge: order.input.childAge,
        storyTitle: story.title,
      }),
    ),
  );

  const cover: GeneratedIllustration = {
    key: "cover",
    storageKey: "orders/test/cover.jpg",
    kind: "cover",
    alt: "Обложка сказки «" + story.title + "»",
    provider: illustrator.id,
    mimeType: "image/jpeg",
  };

  const illustrations = story.illustrationScenes.map((scene, index) => {
    const image = sceneImages[index]!;
    return {
      key: "scene-" + scene.chapterIndex,
      storageKey: "orders/test/scene-" + scene.chapterIndex + ".jpg",
      kind: "scene" as const,
      chapterIndex: scene.chapterIndex,
      alt: scene.alt,
      provider: illustrator.id,
      mimeType: image.mimeType,
      data: image.data,
    };
  });

  const pdf = await buildBookPdf({
    order,
    story,
    cover,
    coverData: coverImage.data,
    illustrations,
  });

  return { pdf, story };
};

const countPdfPages = (pdf: Buffer) =>
  (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

describe("buildBookPdf", () => {
  let pdf: Buffer;
  let story: StoryBook;

  beforeAll(async () => {
    ({ pdf, story } = await buildTestBook());
  }, 60_000);

  it("renders a multi-page PDF with cyrillic text and illustrations", () => {
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(200_000);
    // Обложка + 9 глав + завершающий разворот + страница письма.
    expect(countPdfPages(pdf)).toBe(story.chapters.length + 3);
  });

  it("writes book metadata into the pdf info dictionary", () => {
    const raw = pdf.toString("latin1");
    expect(raw).toContain("/Title");
    expect(raw).toContain("/Creator");
    expect(raw).toContain("/Producer");
  });
});
