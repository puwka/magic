import type { OrderRepository } from "@/lib/orders/types";
import { getAppConfig } from "@/lib/config";
import { getLocalOrderRepository } from "@/lib/orders/local-repository";
import { SupabaseOrderRepository } from "@/lib/orders/supabase-repository";

let repository: OrderRepository | null = null;

export const getOrderRepository = (): OrderRepository => {
  if (repository) return repository;
  const config = getAppConfig();

  if (config.supabase.url && config.supabase.serviceRoleKey) {
    repository = new SupabaseOrderRepository();
    return repository;
  }

  repository = getLocalOrderRepository();
  return repository;
};

export const resetOrderRepositoryForTests = () => {
  repository = null;
};
