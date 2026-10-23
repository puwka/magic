import { AppError, toErrorResponse } from "@/lib/http";
import { enforceRateLimit, getOrderToken } from "@/lib/api/guard";
import { requireOrder } from "@/lib/orders/service";
import { getFileStorage } from "@/lib/storage";
import { binaryResponse } from "@/lib/api/asset-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = async (request: Request, context: RouteContext) => {
  try {
    enforceRateLimit(request, "orders:asset", 240, 60 * 1000);
    const { id } = await context.params;
    const order = await requireOrder(id, getOrderToken(request));
    const cover = order.result?.cover;
    if (!cover) throw new AppError("Иллюстрация ещё не готова.", 404, "asset_not_found");

    const data = await getFileStorage().get(cover.storageKey);
    return binaryResponse({
      data,
      contentType: cover.mimeType,
      filename: "magia-cover-" + order.orderNumber.toLowerCase() + ".jpg",
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось загрузить обложку.");
  }
};
