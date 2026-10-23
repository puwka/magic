"use client";

export type ApiError = {
  message: string;
  code: string;
  status: number;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const parseError = async (response: Response): Promise<ApiError> => {
  let message = "Не удалось выполнить запрос. Попробуйте ещё раз.";
  let code = "unknown";
  try {
    const payload = (await response.json()) as { error?: { message?: string; code?: string } };
    if (payload?.error?.message) message = payload.error.message;
    if (payload?.error?.code) code = payload.error.code;
  } catch {
    // keep defaults
  }
  return { message, code, status: response.status };
};

export const apiRequest = async <T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null; signal?: AbortSignal } = {},
): Promise<ApiResult<T>> => {
  const { method = "GET", body, token, signal } = options;
  try {
    const response = await fetch(path, {
      method,
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { "x-order-token": token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      return { ok: false, error: await parseError(response) };
    }

    const payload = (await response.json()) as T;
    return { ok: true, data: payload };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, error: { message: "Запрос отменён.", code: "aborted", status: 0 } };
    }
    return {
      ok: false,
      error: { message: "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.", code: "network", status: 0 },
    };
  }
};
