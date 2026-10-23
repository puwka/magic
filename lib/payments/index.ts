import { getAppConfig } from "@/lib/config";
import type { PaymentProvider } from "@/lib/payments/types";
import { TestPaymentProvider } from "@/lib/payments/test-provider";
import { YooKassaPaymentProvider } from "@/lib/payments/yookassa-provider";

export const getPaymentProvider = (): PaymentProvider => {
  const config = getAppConfig();
  if (config.payment.provider === "yookassa") {
    return new YooKassaPaymentProvider({
      shopId: config.payment.yookassaShopId,
      secretKey: config.payment.yookassaSecretKey,
      returnUrl: config.payment.yookassaReturnUrl || config.appUrl + "/order",
    });
  }
  return new TestPaymentProvider();
};
