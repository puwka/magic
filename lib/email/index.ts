import { getAppConfig } from "@/lib/config";
import type { EmailProvider } from "@/lib/email/types";
import { OutboxEmailProvider } from "@/lib/email/outbox-provider";
import { ResendEmailProvider } from "@/lib/email/resend-provider";

export const getEmailProvider = (): EmailProvider | null => {
  const config = getAppConfig();
  if (config.email.provider === "disabled") return null;
  if (config.email.provider === "resend") return new ResendEmailProvider();
  return new OutboxEmailProvider();
};
