/**
 * Generates static illustration assets for the public pages:
 *  - public/images/examples/*.jpg — book fragments for the landing gallery
 *  - public/images/themes/*.jpg   — small previews for the theme cards in the builder
 *
 * The assets are produced by the same deterministic SVG illustrator that is used
 * as the offline fallback for real orders, so the landing page never shows
 * anything a customer cannot actually receive.
 *
 * Usage: npx tsx scripts/generate-assets.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createSceneSvg } from "../lib/illustration/scenes";
import type { SceneKind } from "../lib/illustration/scenes";
import { DEMO_STORIES } from "../lib/content/demo-stories";
import { THEMES } from "../lib/content/options";

const publicDir = path.join(process.cwd(), "public", "images");

const render = async (kind: SceneKind, seed: number, width: number, height: number, label: string) => {
  const svg = createSceneSvg({ kind, seed, label });
  return sharp(Buffer.from(svg)).resize(width, height, { fit: "cover" }).jpeg({ quality: 84 }).toBuffer();
};

const main = async () => {
  await mkdir(path.join(publicDir, "examples"), { recursive: true });
  await mkdir(path.join(publicDir, "themes"), { recursive: true });

  for (const story of DEMO_STORIES) {
    const first = await render(story.scene, story.slug.length * 7 + 3, 1200, 825, story.title);
    const second = await render(story.secondScene, story.slug.length * 11 + 5, 1200, 825, story.title);
    await writeFile(path.join(publicDir, "examples", story.slug + "-1.jpg"), first);
    await writeFile(path.join(publicDir, "examples", story.slug + "-2.jpg"), second);
  }

  for (const theme of THEMES) {
    const buffer = await render(theme.scene as SceneKind, theme.id.length * 5 + 9, 720, 400, theme.label);
    await writeFile(path.join(publicDir, "themes", theme.id + ".jpg"), buffer);
  }

  console.log("[magia] Generated example and theme assets in public/images");
};

main().catch((error) => {
  console.error("[magia] Asset generation failed", error);
  process.exitCode = 1;
});
