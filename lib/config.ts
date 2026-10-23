const bool = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const int = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export type AppEnvironment = "development" | "test" | "production";

const getAppEnv = (): AppEnvironment => {
  const value = (process.env.APP_ENV ?? "").toLowerCase();
  if (value === "production" || value === "test") return value;
  return process.env.NODE_ENV === "production" ? "production" : "development";
};

export const getAppConfig = () => {
  const appEnv = getAppEnv();
  const demoMode = bool(process.env.DEMO_MODE, false);
  const imageProvider = process.env.IMAGE_PROVIDER === "openai" ? "openai" : "local";
  const textBaseUrl = process.env.AI_TEXT_BASE_URL ?? "";
  const imageBaseUrl = process.env.AI_IMAGE_BASE_URL ?? textBaseUrl;
  const imageApiKey = process.env.AI_IMAGE_API_KEY ?? (process.env.AI_IMAGE_BASE_URL ? "" : process.env.AI_TEXT_API_KEY ?? "");
  const textConfigured = Boolean(textBaseUrl && process.env.AI_TEXT_API_KEY && process.env.AI_TEXT_MODEL);

  return {
    appEnv,
    appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    demoMode,
    priceRub: Math.max(1, int(process.env.PRODUCT_PRICE_RUB, 499)),
    currency: "RUB" as const,
    orderAccessSecret: process.env.ORDER_ACCESS_SECRET ?? "",
    generationMaxAttempts: Math.max(1, Math.min(5, int(process.env.GENERATION_MAX_ATTEMPTS, 3))),
    supabase: {
      url: process.env.SUPABASE_URL ?? "",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "magia-private",
    },
    ai: {
      textBaseUrl,
      textApiKey: process.env.AI_TEXT_API_KEY ?? "",
      textModel: process.env.AI_TEXT_MODEL ?? "",
      textTimeoutMs: int(process.env.AI_TEXT_TIMEOUT_MS, 90_000),
      imageProvider,
      imageBaseUrl,
      imageApiKey,
      imageModel: process.env.AI_IMAGE_MODEL ?? "",
      imageSize: process.env.AI_IMAGE_SIZE ?? "1536x1024",
      imageTimeoutMs: int(process.env.AI_IMAGE_TIMEOUT_MS, 120_000),
      textConfigured,
    },
    payment: {
      provider: (process.env.PAYMENT_PROVIDER ?? "test") as "test" | "yookassa",
      yookassaShopId: process.env.YOOKASSA_SHOP_ID ?? "",
      yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY ?? "",
      yookassaReturnUrl: process.env.YOOKASSA_RETURN_URL ?? "",
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER ?? "outbox") as "outbox" | "resend" | "disabled",
      resendApiKey: process.env.RESEND_API_KEY ?? "",
      from: process.env.EMAIL_FROM ?? "Магия <hello@example.com>",
    },
    storage: {
      dataDir: process.env.ORDER_DATA_DIR ?? "data",
      localStorageDir: process.env.LOCAL_STORAGE_DIR ?? "data/storage",
    },
    supportEmail: process.env.SUPPORT_EMAIL ?? "support@magia.example",
    inlineWorker: bool(process.env.INLINE_WORKER, true),
    cronSecret: process.env.CRON_SECRET ?? "",
  };
};

export type AppConfig = ReturnType<typeof getAppConfig>;

export const assertRuntimeSafety = (config = getAppConfig()) => {
  if (config.orderAccessSecret.length < 32) {
    throw new Error("ORDER_ACCESS_SECRET must contain at least 32 characters.");
  }

  let parsedAppUrl: URL;
  try {
    parsedAppUrl = new URL(config.appUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }
  if (config.appEnv === "production" && parsedAppUrl.protocol !== "https:") {
    throw new Error("APP_URL must use https in production.");
  }

  if (config.demoMode && config.appEnv === "production") {
    throw new Error("DEMO_MODE must be disabled in production.");
  }

  if (config.appEnv === "production") {
    if (config.payment.provider === "test") {
      throw new Error("The test payment provider is forbidden in production.");
    }
    if (config.email.provider === "outbox") {
      console.warn("[magia] EMAIL_PROVIDER=outbox in production — emails will not be delivered to real users.");
    }
  }

  if (config.payment.provider === "yookassa") {
    if (!config.payment.yookassaShopId || !config.payment.yookassaSecretKey) {
      throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are required for the YooKassa provider.");
    }
  }

  if (config.ai.textConfigured) {
    try {
      new URL(config.ai.textBaseUrl);
    } catch {
      throw new Error("AI_TEXT_BASE_URL must be a valid absolute URL.");
    }
  }

  if (config.ai.imageProvider === "openai") {
    try {
      new URL(config.ai.imageBaseUrl);
    } catch {
      throw new Error("AI_IMAGE_BASE_URL must be a valid absolute URL when IMAGE_PROVIDER=openai.");
    }
  }

  if (!config.demoMode && !config.ai.textConfigured) {
    console.warn("[magia] AI text provider is not configured. New orders will be disabled or generation will fail.");
  }
};

export const isGenerationAvailable = (config = getAppConfig()) => {
  return config.demoMode || config.ai.textConfigured;
};

export const isTestPaymentAllowed = (config = getAppConfig()) => {
  return config.payment.provider === "test" && config.appEnv !== "production";
};
