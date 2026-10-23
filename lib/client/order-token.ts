"use client";

const keyFor = (orderId: string) => "magia:order-token:" + orderId;

const readFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) return null;
  return token.length <= 300 ? token : null;
};

const hideTokenInUrl = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("token")) return;
  url.searchParams.delete("token");
  const search = url.searchParams.toString();
  window.history.replaceState(window.history.state, "", url.pathname + (search ? "?" + search : "") + url.hash);
};

export const storeOrderToken = (orderId: string, token: string) => {
  try {
    window.sessionStorage.setItem(keyFor(orderId), token);
  } catch {
    // sessionStorage may be unavailable in private modes — the URL token still works
  }
};

/**
 * Resolves the personal access token for an order. The token is captured from
 * the URL once, moved into sessionStorage and removed from the address bar so it
 * does not leak through history, screenshots or shared links.
 */
export const captureOrderToken = (orderId: string): string | null => {
  const fromUrl = readFromUrl();
  if (fromUrl) {
    storeOrderToken(orderId, fromUrl);
    hideTokenInUrl();
    return fromUrl;
  }
  try {
    return window.sessionStorage.getItem(keyFor(orderId));
  } catch {
    return null;
  }
};
