import { describe, expect, it } from "vitest";
import { DemoTextProvider } from "@/lib/generation/demo-text-provider";
import { storyBookSchema } from "@/lib/generation/types";
import { THEMES } from "@/lib/content/options";
import { unsafeContentPattern } from "@/lib/validation/order";

const provider = new DemoTextProvider();

const request = {
  childName: "Аня",
  childAge: 6,
  interests: ["space", "drawing"],
  extraDetails: "",
  theme: "cosmos",
  mood: "magical",
  wish: "",
};

describe("DemoTextProvider", () => {
  it("creates a complete book that satisfies the story schema for every theme", async () => {
    for (const theme of THEMES) {
      const story = await provider.generate({ ...request, theme: theme.id });
      expect(() => storyBookSchema.parse(story)).not.toThrow();
      expect(story.chapters).toHaveLength(9);
      expect(story.illustrationScenes).toHaveLength(4);
      expect(new Set(story.illustrationScenes.map((scene) => scene.chapterIndex)).size).toBe(4);
    }
  });

  it("personalises the story with the child's name", async () => {
    const story = await provider.generate(request);
    expect(story.title).toContain("Аня");
    expect(story.letter).toContain("Аня");
    expect(story.chapters.some((chapter) => chapter.text.includes("Аня"))).toBe(true);
  });

  it("keeps the story free from unsafe words", async () => {
    const story = await provider.generate(request);
    const whole = [story.title, story.subtitle, story.dedication, story.letter, story.closingLine]
      .concat(story.chapters.map((chapter) => chapter.title + " " + chapter.text))
      .join(" ");
    expect(unsafeContentPattern.test(whole)).toBe(false);
  });

  it("keeps the child's name in the nominative and never guesses gender", async () => {
    const story = await provider.generate(request);
    const whole =
      [story.subtitle, story.dedication, story.letter].join(" ") +
      " " +
      story.chapters.map((chapter) => chapter.text).join(" ");
    // Склонённые формы имени означали бы, что автор угадывает падеж.
    expect(/(?<![\p{L}])Ан(е|ю|ей|и)(?![\p{L}])/u.test(whole)).toBe(false);
    // Никаких родовых обращений и профессий героя.
    expect(
      /(?<![\p{L}])(мальчик|мальчика|девочка|девочку|сынок|доченька|герой|героя|героем|героиня)(?![\p{L}])/iu.test(whole),
    ).toBe(false);
    // Прошедшее время в форме единственного числа выдаёт род — его тоже нет.
    expect(
      /(?<![\p{L}])(понял|поняла|решил|решила|устал|устала|обрадовался|обрадовалась|испугался|испугалась)(?![\p{L}])/iu.test(
        whole,
      ),
    ).toBe(false);
  });

  it("never puts the nominative name into a prepositional phrase", async () => {
    for (const theme of THEMES) {
      const story = await provider.generate({ ...request, theme: theme.id });
      const whole = [story.title, story.subtitle, story.dedication, story.letter, ...story.chapters.map((c) => c.text)]
        .join(" ")
        .toLowerCase();
      expect(whole).not.toContain("для аня");
      expect(whole).not.toContain("про аня");
    }
  });

  it("keeps place names and sentence starts grammatical in every theme", async () => {
    for (const theme of THEMES) {
      const story = await provider.generate({ ...request, theme: theme.id });
      const whole = story.chapters.map((chapter) => chapter.text).join(" ");
      // После точки, вопросительного или восклицательного знака — заглавная.
      expect(whole).not.toMatch(/[.!?]\s+[а-яё]/u);
      // Прямая речь и цитаты тоже начинаются с заглавной.
      expect(whole).not.toMatch(/«[а-яё]/u);
      // Названия мест стоят в падеже, которого требует предлог.
      expect(whole).not.toMatch(/до\s+(ручей|обсерваторию|папоротниковую|перевал|крыши)\b/iu);
      expect(whole).not.toMatch(/где начинается\s+(вернуть|зажечь|найти|разбудить|освободить)\b/iu);
    }
  });

  it("reflects interests, wishes and extra details in the story", async () => {
    const story = await provider.generate({
      ...request,
      interests: ["dinosaurs"],
      wish: "побывать на Луне",
      extraDetails: "любит рисовать кометы",
    });
    const whole = story.chapters.map((chapter) => chapter.text).join(" ");
    expect(whole).toContain("фигурка динозавра");
    expect(whole).toContain("Побывать на Луне");
    expect(whole).toContain("Любит рисовать кометы");
  });

  it("falls back to the forest theme for an unknown theme id", async () => {
    const story = await provider.generate({ ...request, theme: "unknown-theme" });
    expect(story.chapters).toHaveLength(9);
    expect(story.subtitle).toBe("Сказка о семи огнях и тропинке, которая помнит дом");
  });

  it("is deterministic for the same order data", async () => {
    const first = await provider.generate(request);
    const second = await provider.generate(request);
    expect(second.title).toBe(first.title);
    expect(second.chapters[0]!.text).toBe(first.chapters[0]!.text);
  });
});
