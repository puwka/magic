import { promises as fs } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { authorizeOrder, confirmTestPayment, createOrder, deleteOrderData } from "@/lib/orders/service";
import { processGenerationJobs } from "@/lib/generation/worker";
import { getOrderRepository, resetOrderRepositoryForTests } from "@/lib/orders/repository";
import { resetLocalRepositoryForTests } from "@/lib/orders/local-repository";
import { getFileStorage, resetFileStorageForTests } from "@/lib/storage";
import type { OrderInput } from "@/lib/validation/order";

const TEST_DATA_DIR = path.resolve(process.cwd(), "data", "test");

const validInput: OrderInput = {
  childName: "Аня",
  childAge: 6,
  interests: ["space", "drawing"],
  extraDetails: "любит рисовать кометы",
  theme: "cosmos",
  mood: "magical",
  wish: "побывать на Луне",
  email: "parent@example.com",
  consent: true,
  consentVersion: "2026-10-23",
};

describe("order lifecycle (local repository, demo generation)", () => {
  beforeAll(async () => {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    resetOrderRepositoryForTests();
    resetLocalRepositoryForTests();
    resetFileStorageForTests();
  });

  it("creates, pays, generates and delivers an order end to end", async () => {
    const created = await createOrder(validInput);
    expect(created.order.status).toBe("pending_payment");
    expect(created.order.paymentStatus).toBe("pending");
    expect(created.order.isDemo).toBe(true);
    expect(created.order.priceRub).toBe(499);
    expect(created.checkoutUrl).toBe("/pay/" + created.order.id);
    expect(created.orderLink).toContain("/order/" + created.order.id + "?token=");

    // Гостевой доступ: верный токен открывает заказ, чужой — нет.
    const authorized = await authorizeOrder(created.order.id, created.token);
    expect(authorized?.id).toBe(created.order.id);
    expect(await authorizeOrder(created.order.id, "wrong-token")).toBeNull();
    expect(await authorizeOrder(created.order.id, null)).toBeNull();
    // В базе нет открытого токена — только его хэш и шифротекст.
    const stored = await getOrderRepository().getOrder(created.order.id);
    expect(stored?.accessTokenHash).toBeTruthy();
    expect(stored?.accessTokenHash).not.toBe(created.token);
    expect(stored?.accessTokenCiphertext).not.toContain(created.token);

    const paid = await confirmTestPayment(created.order.id, created.token);
    expect(paid.status).toBe("paid");
    expect(paid.paymentStatus).toBe("paid");
    expect(paid.generation.status).toBe("queued");

    const workerResult = await processGenerationJobs(1);
    expect(workerResult.processed).toBe(1);
    expect(workerResult.completed).toBe(1);

    const finished = await getOrderRepository().getOrder(created.order.id);
    expect(finished?.status).toBe("completed");
    expect(finished?.generation.progress).toBe(100);
    expect(finished?.result?.story.chapters).toHaveLength(9);
    expect(finished?.result?.illustrations.length).toBeGreaterThanOrEqual(3);
    expect(finished?.result?.isDemo).toBe(true);

    const pdf = await getFileStorage().get(finished!.pdfStorageKey!);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(100_000);

    // Письмо с готовой книгой попало в локальный outbox.
    const outbox = path.join(TEST_DATA_DIR, "outbox");
    const emails = await fs.readdir(outbox);
    expect(emails.length).toBeGreaterThanOrEqual(1);
    const letter = await fs.readFile(path.join(outbox, emails[0]!), "utf8");
    expect(letter).toContain(created.order.orderNumber);
    expect(letter).toContain("parent@example.com");

    // Повторное подтверждение оплаты идемпотентно.
    const repeated = await confirmTestPayment(created.order.id, created.token);
    expect(repeated.status).toBe("completed");
    const idleWorker = await processGenerationJobs(1);
    expect(idleWorker.processed).toBe(0);

    // Ответы API и PDF не должны содержать токен доступа.
    expect(JSON.stringify(finished)).not.toContain(created.token);
  }, 120_000);

  it("rejects a test payment for a forged token", async () => {
    const created = await createOrder(validInput);
    await expect(confirmTestPayment(created.order.id, "forged-token")).rejects.toThrow();
    const stored = await getOrderRepository().getOrder(created.order.id);
    expect(stored?.status).toBe("pending_payment");
  }, 60_000);

  it("removes personal data and invalidates the guest link on request", async () => {
    const created = await createOrder(validInput);
    const cleared = await deleteOrderData(created.order.id, created.token);
    expect(cleared.dataDeletedAt).toBeTruthy();
    expect(cleared.input.childName).toBe("Данные удалены");
    expect(cleared.email).toBe("deleted@invalid.local");
    expect(await authorizeOrder(created.order.id, created.token)).toBeNull();

    const stored = await getOrderRepository().getOrder(created.order.id);
    expect(stored?.result).toBeNull();
    expect(stored?.pdfStorageKey).toBeNull();
    expect(stored?.accessTokenHash).toBe("");
  }, 60_000);
});
