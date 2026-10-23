import { getAppConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { FileStorage } from "@/lib/storage/types";

export class SupabaseFileStorage implements FileStorage {
  readonly id = "supabase" as const;

  private bucket() {
    return getAppConfig().supabase.bucket;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await getSupabaseAdmin().storage.from(this.bucket()).upload(key, data, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });
    if (error) throw new Error("Supabase upload failed: " + error.message);
  }

  async get(key: string): Promise<Buffer> {
    const { data, error } = await getSupabaseAdmin().storage.from(this.bucket()).download(key);
    if (error || !data) throw new Error("Supabase download failed: " + (error?.message ?? "no data"));
    return Buffer.from(await data.arrayBuffer());
  }

  async delete(keys: string[]): Promise<void> {
    if (!keys.length) return;
    const { error } = await getSupabaseAdmin().storage.from(this.bucket()).remove(keys);
    if (error) throw new Error("Supabase delete failed: " + error.message);
  }
}
