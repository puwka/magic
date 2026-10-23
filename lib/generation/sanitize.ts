import { storyBookSchema, type StoryBook } from "@/lib/generation/types";

// Кириллица не образует \b в JS-регулярках без Unicode-границ: используем
// подстроки и Unicode-проверки, чтобы фильтр действительно срабатывал.
const unsafePattern =
  /(порн|секс|эротич|изнасил|интимн(ый|ая|ые)(?![\p{L}])|обнаж[её]н|убий|расчлен|суицид|самоубий|наркот|террорист|взрывчат|пытк|сексуальн|кро(вь|ви|вью|вав)|издевательств|жесток(о|ий|ая)\s+(уб|насил)|оружи[ея]|пистолет|автомат(?![\p{L}])|(?<![\p{L}\p{N}])нож(?![\p{L}\p{N}]))/iu;

const normalize = (value: string) =>
  value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const plainText = (value: string) =>
  normalize(
    value
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/www\.\S+/gi, " ")
      .replace(/[*_`#>]+/g, " "),
  );

const trimAtSentence = (value: string, max: number) => {
  if (value.length <= max) return value;
  const slice = value.slice(0, max + 1);
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (sentenceEnd >= Math.floor(max * 0.55)) return slice.slice(0, sentenceEnd + 1).trim();
  const wordEnd = slice.lastIndexOf(" ");
  return slice.slice(0, wordEnd > 0 ? wordEnd : max).trim();
};

const stripCodeFence = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
};

const parseJsonObject = (raw: string): unknown => {
  const cleaned = stripCodeFence(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("The model did not return a JSON object.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
};

const cleanPrompt = (value: string, max = 700) => {
  const cleaned = plainText(value).replace(/["\\]/g, " ").trim();
  return trimAtSentence(cleaned, max);
};

const assertSafe = (value: string) => {
  if (unsafePattern.test(value)) {
    throw new Error("Generated story contains content that is not suitable for children.");
  }
};

const sanitizeChapterText = (value: string) => {
  const cleaned = plainText(value);
  const limited = trimAtSentence(cleaned, 1100);
  return {
    text: limited,
    wasTrimmed: limited !== cleaned,
  };
};

export const parseAndSanitizeStory = (raw: string, childName: string): { story: StoryBook; trimmed: boolean } => {
  const parsed = parseJsonObject(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The model returned an invalid story object.");
  }

  const source = parsed as Record<string, unknown>;
  const chaptersSource = Array.isArray(source.chapters) ? source.chapters : [];
  const scenesSource = Array.isArray(source.illustrationScenes) ? source.illustrationScenes : [];

  let trimmed = false;
  const chapters = chaptersSource.slice(0, 10).map((entry) => {
    const chapter = (entry ?? {}) as Record<string, unknown>;
    const title = trimAtSentence(plainText(String(chapter.title ?? "")), 90);
    const { text, wasTrimmed } = sanitizeChapterText(String(chapter.text ?? ""));
    trimmed = trimmed || wasTrimmed;
    return { title, text };
  });

  const seen = new Set<number>();
  const illustrationScenes = scenesSource
    .slice(0, 5)
    .map((entry) => {
      const scene = (entry ?? {}) as Record<string, unknown>;
      return {
        chapterIndex: Number(scene.chapterIndex),
        alt: trimAtSentence(plainText(String(scene.alt ?? "")), 180),
        prompt: cleanPrompt(String(scene.prompt ?? "")),
      };
    })
    .filter((scene) => {
      if (!Number.isInteger(scene.chapterIndex) || scene.chapterIndex < 0 || scene.chapterIndex >= chapters.length) {
        return false;
      }
      if (seen.has(scene.chapterIndex)) return false;
      seen.add(scene.chapterIndex);
      return true;
    });

  const story: StoryBook = {
    title: trimAtSentence(plainText(String(source.title ?? "")), 90),
    subtitle: trimAtSentence(plainText(String(source.subtitle ?? "")), 140),
    dedication: trimAtSentence(plainText(String(source.dedication ?? "")), 260),
    chapters,
    illustrationScenes,
    coverPrompt: cleanPrompt(String(source.coverPrompt ?? "")),
    letter: trimAtSentence(plainText(String(source.letter ?? "")), 1400),
    closingLine: trimAtSentence(plainText(String(source.closingLine ?? "")), 180),
  };

  assertSafe(story.title + " " + story.subtitle + " " + story.dedication + " " + story.coverPrompt);
  assertSafe(story.chapters.map((chapter) => chapter.title + " " + chapter.text).join(" "));
  assertSafe(story.illustrationScenes.map((scene) => scene.alt + " " + scene.prompt).join(" "));
  assertSafe(story.letter + " " + story.closingLine);

  if (!story.title.toLowerCase().includes(childName.toLowerCase())) {
    // Personalisation is a product promise, but the title is not the only place where it appears.
    // Add the name only when it fits naturally and the title is short enough.
    const candidate = story.title + " для " + childName;
    if (candidate.length <= 90) story.title = candidate;
  }

  return { story: storyBookSchema.parse(story), trimmed };
};
