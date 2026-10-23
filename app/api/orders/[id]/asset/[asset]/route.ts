import { AppError, toErrorResponse } from "@/lib/http";
import { enforceRateLimit, getOrderToken } from "@/lib/api/guard";
import { requireOrder } from "@/lib/orders/service";
import { getFileStorage } from "@/lib/storage";
import { binaryResponse } from "@/lib/api/asset-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; asset: string }> };

export const GET = async (request: Request, context: RouteContext) => {
  try {
    enforceRateLimit(request, "orders:asset", 240, 60 * 1000);
    const { id, asset } = await context.params;
    if (!/^[a-z0-9-]{1,32}$/i.test(asset)) {
      throw new AppError("Некорректная иллюстрация.", 400, "invalid_asset");
    }

    const order = await requireOrder(id, getOrderToken(request));
    const illustration = order.result?.illustrations.find((item) => item.key === asset);
    if (!illustration) {
      throw new AppError("Иллюстрация не найдена.", 404, "asset_not_found");
    }

    const data = await getFileStorage().get(illustration.storageKey);
    return binaryResponse({
      data,
      contentType: illustration.mimeType,
      filename: "magia-" + asset + "-" + order.orderNumber.toLowerCase() + ".jpg",
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось загрузить иллюстрацию.");
  }
};
