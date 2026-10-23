import { promises as fs } from "node:fs";
import path from "node:path";
import type { Order, OrderRepository, PaymentRecord } from "@/lib/orders/types";
import { getAppConfig } from "@/lib/config";

type Database = {
  orders: Order[];
  payments: PaymentRecord[];
};

const emptyDatabase = (): Database => ({ orders: [], payments: [] });

class LocalOrderRepository implements OrderRepository {
  private cache: Database | null = null;
  private lock: Promise<unknown> = Promise.resolve();
  private readonly filePath: string;

  constructor() {
    const config = getAppConfig();
    this.filePath = path.resolve(process.cwd(), config.storage.dataDir, "db.json");
  }

  private async withLock<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.lock;
    let release: () => void = () => {};
    this.lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
    }
  }

  private async read(): Promise<Database> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.cache = JSON.parse(raw) as Database;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
      this.cache = emptyDatabase();
    }
    return this.cache;
  }

  private async persist(database: Database) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = this.filePath + ".tmp-" + process.pid;
    await fs.writeFile(temporary, JSON.stringify(database, null, 2), "utf8");
    await fs.rename(temporary, this.filePath);
    this.cache = database;
  }

  async createOrder(order: Order): Promise<Order> {
    return this.withLock(async () => {
      const database = await this.read();
      database.orders.push(order);
      await this.persist(database);
      return order;
    });
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.withLock(async () => {
      const database = await this.read();
      const order = database.orders.find((entry) => entry.id === id) ?? null;
      return order ? structuredClone(order) : null;
    });
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return this.withLock(async () => {
      const database = await this.read();
      const order = database.orders.find((entry) => entry.orderNumber === orderNumber) ?? null;
      return order ? structuredClone(order) : null;
    });
  }

  async updateOrder(id: string, updater: (order: Order) => Order): Promise<Order | null> {
    return this.withLock(async () => {
      const database = await this.read();
      const index = database.orders.findIndex((order) => order.id === id);
      if (index < 0) return null;
      const next = updater(structuredClone(database.orders[index]));
      next.id = id;
      const timestamp = new Date().toISOString();
      if (next.updatedAt === database.orders[index].updatedAt) next.updatedAt = timestamp;
      database.orders[index] = next;
      await this.persist(database);
      return next;
    });
  }

  async listGenerationCandidates(nowIso: string, limit: number): Promise<Order[]> {
    return this.withLock(async () => {
      const database = await this.read();
      const now = new Date(nowIso).getTime();
      return database.orders
        .filter((order) => {
          if (order.dataDeletedAt) return false;
          if (order.status === "paid") return true;
          if (order.status === "generating" && order.generation.leaseUntil) {
            return new Date(order.generation.leaseUntil).getTime() <= now;
          }
          return false;
        })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, limit)
        .map((order) => structuredClone(order));
    });
  }

  async claimGeneration(id: string, leaseUntilIso: string): Promise<Order | null> {
    return this.withLock(async () => {
      const database = await this.read();
      const index = database.orders.findIndex((order) => order.id === id);
      if (index < 0) return null;
      const order = database.orders[index];
      const now = Date.now();
      const expiredLease = order.generation.leaseUntil
        ? new Date(order.generation.leaseUntil).getTime() <= now
        : false;
      const claimable = order.status === "paid" || (order.status === "generating" && expiredLease);
      if (!claimable) return null;

      const timestamp = new Date().toISOString();
      const next: Order = {
        ...order,
        status: "generating",
        generation: {
          ...order.generation,
          status: "running",
          step: "queued",
          progress: Math.max(order.generation.progress, 6),
          attempts: order.generation.attempts + 1,
          error: null,
          startedAt: order.generation.startedAt ?? timestamp,
          finishedAt: null,
          leaseUntil: leaseUntilIso,
        },
        updatedAt: timestamp,
      };
      database.orders[index] = next;
      await this.persist(database);
      return structuredClone(next);
    });
  }

  async createPayment(payment: PaymentRecord): Promise<PaymentRecord> {
    return this.withLock(async () => {
      const database = await this.read();
      const existing = database.payments.find((entry) => entry.id === payment.id);
      if (!existing) database.payments.push(payment);
      await this.persist(database);
      return existing ?? payment;
    });
  }

  async getPaymentByProvider(provider: string, providerPaymentId: string): Promise<PaymentRecord | null> {
    return this.withLock(async () => {
      const database = await this.read();
      return database.payments.find(
        (entry) => entry.provider === provider && entry.providerPaymentId === providerPaymentId,
      ) ?? null;
    });
  }

  async updatePayment(id: string, updater: (payment: PaymentRecord) => PaymentRecord): Promise<PaymentRecord | null> {
    return this.withLock(async () => {
      const database = await this.read();
      const index = database.payments.findIndex((entry) => entry.id === id);
      if (index < 0) return null;
      const next = updater(structuredClone(database.payments[index]));
      next.updatedAt = new Date().toISOString();
      database.payments[index] = next;
      await this.persist(database);
      return next;
    });
  }

  async clearOrderData(order: Order): Promise<Order> {
    const updated = await this.updateOrder(order.id, (current) => ({
      ...current,
      accessTokenHash: "",
      accessTokenCiphertext: "",
      input: {
        childName: "Данные удалены",
        childAge: 0,
        interests: [],
        extraDetails: "",
        theme: "",
        mood: "",
        wish: "",
        email: "deleted@invalid.local",
        consentVersion: current.input.consentVersion,
      },
      email: "deleted@invalid.local",
      emailSentAt: null,
      emailError: null,
      result: null,
      pdfStorageKey: null,
      dataDeletedAt: new Date().toISOString(),
      checkoutUrl: null,
      generation: {
        ...current.generation,
        step: "queued",
        progress: 0,
        error: null,
        leaseUntil: null,
      },
    }));
    if (!updated) throw new Error("Order not found");
    return updated;
  }
}

let repository: LocalOrderRepository | null = null;

export const getLocalOrderRepository = () => {
  if (!repository) repository = new LocalOrderRepository();
  return repository;
};

export const resetLocalRepositoryForTests = () => {
  repository = null;
};
