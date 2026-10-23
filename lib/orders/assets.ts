import type { Order } from "@/lib/orders/types";
import { getFileStorage } from "@/lib/storage";

export const deleteOrderAssets = async (order: Order) => {
  const keys = [
    ...(order.result?.cover.storageKey ? [order.result.cover.storageKey] : []),
    ...(order.result?.illustrations.map((item) => item.storageKey) ?? []),
    ...(order.pdfStorageKey ? [order.pdfStorageKey] : []),
  ];
  if (!keys.length) return;
  await getFileStorage().delete([...new Set(keys)]);
};
