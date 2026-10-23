import { getAppConfig } from "@/lib/config";
import { processGenerationJobs } from "@/lib/generation/worker";

let activeRun: Promise<unknown> | null = null;

export const kickGenerationWorker = async (limit = 1) => {
  if (activeRun) return activeRun;
  activeRun = processGenerationJobs(limit).finally(() => {
    activeRun = null;
  });
  return activeRun;
};

export const shouldRunInlineWorker = () => getAppConfig().inlineWorker;
