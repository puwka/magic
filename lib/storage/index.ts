import { getAppConfig } from "@/lib/config";
import type { FileStorage } from "@/lib/storage/types";
import { LocalFileStorage } from "@/lib/storage/local-storage";
import { SupabaseFileStorage } from "@/lib/storage/supabase-storage";

let storage: FileStorage | null = null;

export const getFileStorage = (): FileStorage => {
  if (storage) return storage;
  const config = getAppConfig();
  storage = config.supabase.url && config.supabase.serviceRoleKey
    ? new SupabaseFileStorage()
    : new LocalFileStorage();
  return storage;
};

export const resetFileStorageForTests = () => {
  storage = null;
};
