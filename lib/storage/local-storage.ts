import { promises as fs } from "node:fs";
import path from "node:path";
import { getAppConfig } from "@/lib/config";
import type { FileStorage } from "@/lib/storage/types";

const assertSafeKey = (key: string) => {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_.-]{2,240}$/.test(key) || key.includes("..") || path.isAbsolute(key)) {
    throw new Error("Invalid storage key");
  }
};

export class LocalFileStorage implements FileStorage {
  readonly id = "local" as const;
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), getAppConfig().storage.localStorageDir);
  }

  async put(key: string, data: Buffer): Promise<void> {
    assertSafeKey(key);
    const fullPath = path.join(this.baseDir, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async get(key: string): Promise<Buffer> {
    assertSafeKey(key);
    return fs.readFile(path.join(this.baseDir, key));
  }

  async delete(keys: string[]): Promise<void> {
    await Promise.all(
      keys.map(async (key) => {
        try {
          assertSafeKey(key);
          await fs.unlink(path.join(this.baseDir, key));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }),
    );
  }
}
