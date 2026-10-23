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
    if (!order.pdfStorageKey || !order.result) {
      throw new AppError("PDF ещё не готов.", 404, "pdf_not_ready");
    }

    const data = await getFileStorage().get(order.pdfStorageKey);
    return binaryResponse({
      data,
      contentType: "application/pdf",
      filename: "magia-" + order.orderNumber.toLowerCase() + ".pdf",
      disposition: "attachment",
    });
  } catch (error) {
    return toErrorResponse(error, "Не удалось скачать PDF.");
  }
};
