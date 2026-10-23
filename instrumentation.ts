export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertRuntimeSafety, getAppConfig } = await import("@/lib/config");
  try {
    assertRuntimeSafety(getAppConfig());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[magia] Runtime configuration problem: " + message);
    if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
      throw error;
    }
  }
};
