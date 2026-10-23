/**
 * Постоянный воркер генерации для production и разработки.
 *
 * Запуск:  npm run worker            (опрос каждые 5 секунд)
 *          npm run worker -- --once  (один проход и выход)
 *          npm run worker -- --interval=2000 --limit=1
 *
 * Альтернатива для serverless-хостинга — cron-запрос к /api/cron/worker
 * с заголовком x-cron-secret (см. README).
 */
import { loadEnvConfig } from "@next/env";

const parseArgs = (argv: string[]) => {
  const options = { once: false, interval: 5_000, limit: 2 };
  for (const arg of argv) {
    if (arg === "--once") options.once = true;
    const interval = /^--interval=(\d+)$/.exec(arg);
    if (interval) options.interval = Math.max(500, Number.parseInt(interval[1], 10));
    const limit = /^--limit=(\d+)$/.exec(arg);
    if (limit) options.limit = Math.max(1, Math.min(5, Number.parseInt(limit[1], 10)));
  }
  return options;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  loadEnvConfig(process.cwd());

  const { assertRuntimeSafety, getAppConfig } = await import("@/lib/config");
  const { processGenerationJobs } = await import("@/lib/generation/worker");

  const config = getAppConfig();
  assertRuntimeSafety(config);

  const options = parseArgs(process.argv.slice(2));
  const repositoryLabel = config.supabase.url
    ? "supabase:" + config.supabase.bucket
    : "local:" + config.storage.dataDir;
  const modeLabel = options.once ? "mode=single pass" : `interval=${options.interval}ms`;
  console.log(
    `[magia] worker started — env=${config.appEnv}, demo=${config.demoMode}, storage=${repositoryLabel}, ${modeLabel}`,
  );

  let running = true;
  const stop = () => {
    if (!running) return;
    running = false;
    console.log("[magia] worker stopping…");
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (running) {
    try {
      const result = await processGenerationJobs(options.limit);
      if (result.processed > 0 || result.skipped > 0) {
        console.log(
          `[magia] pass: processed=${result.processed}, completed=${result.completed}, failed=${result.failed}, skipped=${result.skipped}`,
        );
      }
    } catch (error) {
      console.error("[magia] worker pass failed", error);
    }

    if (options.once) break;
    if (running) await sleep(options.interval);
  }

  console.log("[magia] worker stopped");
};

main().catch((error) => {
  console.error("[magia] worker crashed", error);
  process.exitCode = 1;
});
