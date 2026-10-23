import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAppConfig } from "@/lib/config";
import type { Database } from "@/lib/supabase/database";

let client: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = () => {
  const config = getAppConfig();
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error("Supabase is not configured.");
  }
  if (!client) {
    client = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "X-Client-Info": "magia-server" } },
    });
  }
  return client;
};
