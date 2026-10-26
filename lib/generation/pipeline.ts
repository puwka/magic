import { createHash } from "node:crypto";
import type { Order } from "@/lib/orders/types";
import { getFileStorage } from "@/lib/storage";
import type { FileStorage } from "@/lib/storage/types";
import { sceneKindForTheme, type SceneKind } from "@/lib/illustration/scenes";
import { buildBookPdf } from "@/lib/pdf/build-book";
import { getTextProvider } from "@/lib/generation/provider-options";
import { getImageProvider } from "@/lib/generation/image-provider-options";
import { LocalIllustrationProvider } from "@/lib/generation/local-image-provider";
import type { ImageProvider } from "@/lib/generation/image-provider";
import type { GenerationProgress, TextProvider } from "@/lib/generation/text-provider";
import type { GeneratedIllustration, GenerationResult, StoryBook } from "@/lib/generation/types";

export type GeneratedBook = {
  result: GenerationResult;
  pdfStorageKey: string;
};

const seedFor = (value: string) => {
  const digest = createHash("sha256").update(value).digest();
  return digest.readUInt32BE(0);
};

export const sceneSequence = (theme: string): SceneKind[] => {
  const primary = sceneKindForTheme(theme);
  // Четыре иллюстрации должны отличаться друг от друга: утро — дома,
  // дорога — в основном мире, привал — в другом пейзаже, развязка — снова
  // в основном мире. Последняя иллюстрация осознанно повторяется на
  // финальном развороте.
  const rest = primary === "mountains" ? "forest" : "mountains";
  return ["home", primary, rest, primary];
};

const imageKey = (order: Order, name: string) => "orders/" + order.id + "/" + name + ".jpg";

const storeImage = async (
  storage: FileStorage,
  order: Order,
  name: string,
  data: Buffer,
  mimeType: string,
) => {
  const storageKey = imageKey(order, name);
  await storage.put(storageKey, data, mimeType);
  return storageKey;
};

const generateIllustration = async (params: {
  storage: FileStorage;
  order: Order;
  preferredProvider: ImageProvider;
  fallbackProvider: ImageProvider;
  story: StoryBook;
  kind: "cover" | "scene";
  prompt: string;
  alt: string;
  seed: number;
  scene: SceneKind;
  chapterIndex?: number;
  warnings: string[];
}) => {
  const request = {
    kind: params.kind,
    prompt: params.prompt,
    alt: params.alt,
    seed: params.seed,
    scene: params.scene,
    childAge: params.order.input.childAge,
    storyTitle: params.story.title,
  };

  let generated;
  let usedProvider = params.preferredProvider.id;
  try {
    generated = await params.preferredProvider.generateImage(request);
  } catch (error) {
    console.warn("[magia] Image generation failed; using local illustrator", error);
    generated = await params.fallbackProvider.generateImage(request);
    usedProvider = params.fallbackProvider.id;
    if (!params.warnings.includes("Часть иллюстраций создана встроенным иллюстратором: внешний сервис изображений был недоступен.")) {
      params.warnings.push(
        "Часть иллюстраций создана встроенным иллюстратором: внешний сервис изображений был недоступен.",
      );
    }
  }

  const name = params.kind === "cover" ? "cover" : "scene-" + (params.chapterIndex ?? 0);
  const storageKey = await storeImage(params.storage, params.order, name, generated.data, generated.mimeType);

  const illustration: GeneratedIllustration = {
    key: params.kind === "cover" ? "cover" : "scene-" + (params.chapterIndex ?? 0),
    storageKey,
    kind: params.kind,
    ...(params.chapterIndex !== undefined ? { chapterIndex: params.chapterIndex } : {}),
    alt: params.alt,
    provider: usedProvider,
    mimeType: generated.mimeType,
  };

  return illustration;
};

export const generateOrderBook = async (order: Order, onProgress: GenerationProgress): Promise<GeneratedBook> => {
  const config = getTextProviderForOrder(order);
  const textProvider: TextProvider = config.provider;
  const warnings: string[] = [];
  const storage = getFileStorage();

  await onProgress("story");
  const story = await textProvider.generate({
    childName: order.input.childName,
    childAge: order.input.childAge,
    interests: order.input.interests,
    extraDetails: order.input.extraDetails,
    theme: order.input.theme,
    mood: order.input.mood,
    wish: order.input.wish,
  });

  await onProgress("cover");
  const imageSelection = getImageProvider();
  if (imageSelection.warning) warnings.push(imageSelection.warning);
  const localProvider = new LocalIllustrationProvider();
  const preferredProvider = imageSelection.provider;

  const cover = await generateIllustration({
    storage,
    order,
    preferredProvider,
    fallbackProvider: localProvider,
    story,
    kind: "cover",
    prompt: story.coverPrompt,
    alt: "Обложка сказки «" + story.title + "»",
    seed: seedFor(order.id + "-cover"),
    scene: sceneKindForTheme(order.input.theme),
    warnings,
  });

  await onProgress("illustrations");
  const sceneKinds = sceneSequence(order.input.theme);
  const illustrationData = await Promise.all(
    story.illustrationScenes.map(async (scene, index) =>
      generateIllustration({
        storage,
        order,
        preferredProvider,
        fallbackProvider: localProvider,
        story,
        kind: "scene",
        prompt: scene.prompt,
        alt: scene.alt,
        seed: seedFor(order.id + "-scene-" + index),
        scene: sceneKinds[index] ?? sceneKinds[0],
        chapterIndex: scene.chapterIndex,
        warnings,
      }),
    ),
  );

  await onProgress("pdf");
  const coverData = await storage.get(cover.storageKey);
  const illustrationsWithData = await Promise.all(
    illustrationData.map(async (illustration) => ({
      ...illustration,
      data: await storage.get(illustration.storageKey),
    })),
  );

  const pdfBuffer = await buildBookPdf({
    order,
    story,
    cover,
    coverData,
    illustrations: illustrationsWithData,
  });

  const pdfStorageKey = "orders/" + order.id + "/magia-" + order.orderNumber.toLowerCase() + ".pdf";
  await storage.put(pdfStorageKey, pdfBuffer, "application/pdf");

  const providerIds = new Set([cover.provider, ...illustrationData.map((item) => item.provider)]);
  const imagesProvider =
    providerIds.size === 1 ? [...providerIds][0] : [...providerIds].join(" + ");

  if (textProvider.isDemo) {
    warnings.push("Сказка создана демонстрационным генератором. Это не результат коммерческой AI-генерации.");
  }

  const result: GenerationResult = {
    story,
    cover,
    illustrations: illustrationData,
    templateVersion: "magia-book-v1",
    createdAt: new Date().toISOString(),
    isDemo: textProvider.isDemo || order.isDemo,
    providers: {
      text: textProvider.id,
      images: imagesProvider,
    },
    warnings,
  };

  return { result, pdfStorageKey };
};

const getTextProviderForOrder = (order: Order) => {
  // An order is permanently marked as demo at creation. It must never silently
  // become a "real" AI book later, even if the environment changes.
  const provider = getTextProvider({ forceDemo: order.isDemo });
  return { provider };
};
