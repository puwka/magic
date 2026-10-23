import { after } from "next/server";
import { kickGenerationWorker, shouldRunInlineWorker } from "@/lib/generation/kick";

export const scheduleInlineGeneration = (limit = 1) => {
  if (!shouldRunInlineWorker()) return;
  after(async () => {
    try {
      await kickGenerationWorker(limit);
    } catch (error) {
      console.error("[magia] Inline generation worker failed", error);
    }
  });
};
