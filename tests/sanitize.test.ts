import { describe, expect, it } from "vitest";
import { parseAndSanitizeStory } from "@/lib/generation/sanitize";

const chapter = (title: string, text: string) => ({ title, text });

const longText = (seed: string) =>
  (seed + ". ").repeat(36) + "Конец этой маленькой главы наступает тихо и спокойно.";

const buildRawStory = (overrides: Record<string, unknown> = {}) => ({
  title: "Звёздный компас",
  subtitle: "Сказка о большом небе",
  dedication: "Посвящается маленькому герою этой истории.",
  chapters: Array.from({ length: 9 }, (_, index) =>
    chapter("Глава " + (index + 1), longText("Так проходит день номер " + (index + 1))),
  ),
  illustrationScenes: [
    { chapterIndex: 0, alt: "Ребёнок на холме под звёздным небом", prompt: "child on a hill under a deep blue starry sky" },
    { chapterIndex: 2, alt: "Старая обсерватория и телескоп", prompt: "old observatory with a brass telescope at night" },
    { chapterIndex: 4, alt: "Сад из стеклянных цветов", prompt: "garden of glass flowers in warm golden light" },
  ],
  coverPrompt: "front cover artwork with a deep blue sky and a golden star",
  letter: "Это письмо создано специально для тебя. ".repeat(4),
  closingLine: "Свет становится ярче, когда им делятся.",
  ...overrides,
});

describe("parseAndSanitizeStory", () => {
  it("parses a plain JSON response", () => {
    const { story, trimmed } = parseAndSanitizeStory(JSON.stringify(buildRawStory()), "Аня");
    expect(story.chapters).toHaveLength(9);
    expect(story.illustrationScenes).toHaveLength(3);
    expect(trimmed).toBe(false);
  });

  it("tolerates a fenced JSON block surrounded by prose", () => {
    const raw = "Конечно! Вот история:\n```json\n" + JSON.stringify(buildRawStory()) + "\n```\nНадеюсь, понравится.";
    const { story } = parseAndSanitizeStory(raw, "Аня");
    expect(story.title).toContain("Звёздный компас");
  });

  it("strips markdown, html and urls from the model output", () => {
    const raw = buildRawStory({
      subtitle: "**Сказка** о <b>большом</b> небе https://spam.example",
      chapters: [chapter("## Глава 1", "# " + longText("Текст с разметкой") + " www.bad.example"), ...buildRawStory().chapters.slice(1)],
    });
    const { story } = parseAndSanitizeStory(JSON.stringify(raw), "Аня");
    expect(story.subtitle).not.toContain("*");
    expect(story.subtitle).not.toContain("<");
    expect(story.subtitle).not.toContain("http");
    expect(story.chapters[0]!.title).not.toContain("#");
    expect(story.chapters[0]!.text).not.toContain("www.");
  });

  it("trims over-long chapters and reports it", () => {
    const raw = buildRawStory({
      chapters: [chapter("Глава 1", "Слово ".repeat(400)), ...buildRawStory().chapters.slice(1)],
    });
    const { story, trimmed } = parseAndSanitizeStory(JSON.stringify(raw), "Аня");
    expect(trimmed).toBe(true);
    expect(story.chapters[0]!.text.length).toBeLessThanOrEqual(1101);
  });

  it("drops scenes with duplicate or out-of-range chapter indexes", () => {
    const raw = buildRawStory({
      illustrationScenes: [
        { chapterIndex: 0, alt: "Первая сцена подходит", prompt: "first valid scene for the story" },
        { chapterIndex: 0, alt: "Дубликат той же сцены", prompt: "duplicate scene that must be dropped" },
        { chapterIndex: 42, alt: "Сцена с чужим индексом", prompt: "scene with an out-of-range chapter index" },
        { chapterIndex: 3, alt: "Ещё одна хорошая сцена", prompt: "another valid scene for the story" },
        { chapterIndex: 5, alt: "Третья хорошая сцена", prompt: "third valid scene for the story" },
      ],
    });
    const { story } = parseAndSanitizeStory(JSON.stringify(raw), "Аня");
    expect(story.illustrationScenes.map((scene) => scene.chapterIndex)).toEqual([0, 3, 5]);
  });

  it("rejects unsafe content in any part of the story", () => {
    const raw = buildRawStory({
      chapters: [chapter("Опасная глава", longText("История про оружие").repeat(20)), ...buildRawStory().chapters.slice(1)],
    });
    expect(() => parseAndSanitizeStory(JSON.stringify(raw), "Аня")).toThrow(/not suitable/);
  });

  it("adds the child's name to the title when the model forgot it", () => {
    const { story } = parseAndSanitizeStory(JSON.stringify(buildRawStory()), "Аня");
    expect(story.title).toContain("Аня");
  });

  it("keeps an already personalised title intact", () => {
    const raw = buildRawStory({ title: "Аня и звёздный компас" });
    const { story } = parseAndSanitizeStory(JSON.stringify(raw), "Аня");
    expect(story.title).toBe("Аня и звёздный компас");
  });

  it("fails on malformed or incomplete model responses", () => {
    expect(() => parseAndSanitizeStory("no json here at all", "Аня")).toThrow();
    expect(() => parseAndSanitizeStory(JSON.stringify({ title: "only a title" }), "Аня")).toThrow();
    expect(() => parseAndSanitizeStory("[1, 2, 3]", "Аня")).toThrow();
  });
});
