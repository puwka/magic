import { getAppConfig } from "@/lib/config";
import { progressForStep } from "@/lib/orders/types";
import type { Order, OrderRepository } from "@/lib/orders/types";
import { getOrderRepository } from "@/lib/orders/repository";
import { generateOrderBook } from "@/lib/generation/pipeline";
import { sendBookReadyEmail } from "@/lib/email/notifications";

export type WorkerResult = {
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
};

const LEASE_MS = 8 * 60 * 1000;

const userFacingGenerationError = (attempts: number, maxAttempts: number) =>
  attempts >= maxAttempts
    ? "Не удалось создать книгу после нескольких попыток. Напишите в поддержку — мы поможем без повторной оплаты."
    : "Не удалось завершить генерацию. Попробуйте ещё раз — повторная оплата не потребуется.";

const skipDeleted = async (repository: OrderRepository, order: Order) => {
  if (!order.dataDeletedAt) return false;
  await repository.updateOrder(order.id, (current) => ({
    ...current,
    status: "failed",
    generation: {
      ...current.generation,
      status: "failed",
      error: "Данные заказа удалены.",
      finishedAt: new Date().toISOString(),
      leaseUntil: null,
    },
  }));
  return true;
};

const markStep = async (
  repository: OrderRepository,
  orderId: string,
  step: Parameters<typeof progressForStep>[0],
) => {
  await repository.updateOrder(orderId, (current) => {
    if (current.status !== "generating") return current;
    return {
      ...current,
      generation: {
        ...current.generation,
        status: "running",
        step,
        progress: Math.max(current.generation.progress, progressForStep(step)),
        error: null,
      },
    };
  });
};

const processOrder = async (repository: OrderRepository, order: Order, config: ReturnType<typeof getAppConfig>) => {
  try {
    if (await skipDeleted(repository, order)) return "skipped" as const;

    if (order.generation.attempts > config.generationMaxAttempts) {
      await repository.updateOrder(order.id, (current) => ({
        ...current,
        status: "failed",
        generation: {
          ...current.generation,
          status: "failed",
          error: userFacingGenerationError(current.generation.attempts, config.generationMaxAttempts),
          finishedAt: new Date().toISOString(),
          leaseUntil: null,
        },
      }));
      return "failed" as const;
    }

    const generated = await generateOrderBook(order, async (step) => {
      await markStep(repository, order.id, step);
    });

    await markStep(repository, order.id, "email");

    const beforeEmail = await repository.getOrder(order.id);
    if (beforeEmail) {
      try {
        await sendBookReadyEmail(beforeEmail);
      } catch (error) {
        console.error("[magia] Completion email bookkeeping failed", error);
      }
    }

    const finishedAt = new Date().toISOString();
    const completed = await repository.updateOrder(order.id, (current) => {
      if (current.dataDeletedAt) return current;
      return {
        ...current,
        status: "completed",
        result: generated.result,
        pdfStorageKey: generated.pdfStorageKey,
        completedAt: current.completedAt ?? finishedAt,
        generation: {
          ...current.generation,
          status: "completed",
          step: "email",
          progress: 100,
          error: null,
          finishedAt,
          leaseUntil: null,
        },
      };
    });

    if (!completed) throw new Error("Order disappeared while completing generation.");
    return "completed" as const;
  } catch (error) {
    console.error("[magia] Generation failed for order " + order.id, error);
    const current = await repository.getOrder(order.id);
    if (!current) return "failed" as const;
    const attempts = current.generation.attempts;
    await repository.updateOrder(order.id, (latest) => ({
      ...latest,
      status: "failed",
      generation: {
        ...latest.generation,
        status: "failed",
        error: userFacingGenerationError(attempts, config.generationMaxAttempts),
        finishedAt: new Date().toISOString(),
        leaseUntil: null,
      },
    }));
    return "failed" as const;
  }
};

export const processGenerationJobs = async (limit = 1): Promise<WorkerResult> => {
  const config = getAppConfig();
  const repository = getOrderRepository();
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LEASE_MS).toISOString();
  const candidates = await repository.listGenerationCandidates(now.toISOString(), Math.max(1, Math.min(limit, 5)));
  const result: WorkerResult = { processed: 0, completed: 0, failed: 0, skipped: 0 };

  for (const candidate of candidates) {
    if (candidate.dataDeletedAt) {
      result.skipped += 1;
      continue;
    }

    const claimed = await repository.claimGeneration(candidate.id, leaseUntil);
    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;
    const outcome = await processOrder(repository, claimed, config);
    if (outcome === "completed") result.completed += 1;
    else if (outcome === "skipped") result.skipped += 1;
    else result.failed += 1;
  }

  return result;
};
