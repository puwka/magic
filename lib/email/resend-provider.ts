import { getAppConfig } from "@/lib/config";
import type { EmailMessage, EmailProvider, SentEmail } from "@/lib/email/types";

type ResendResponse = {
  id?: string;
  message?: string;
};

export class ResendEmailProvider implements EmailProvider {
  readonly id = "resend";
  private readonly apiKey: string;
  private readonly from: string;

  constructor() {
    const config = getAppConfig();
    this.apiKey = config.email.resendApiKey;
    this.from = config.email.from;
  }

  async send(message: EmailMessage): Promise<SentEmail> {
    if (!this.apiKey) throw new Error("RESEND_API_KEY is not configured.");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response.json().catch(() => ({}))) as ResendResponse;
    if (!response.ok) {
      throw new Error("Resend responded with " + response.status + (payload.message ? ": " + payload.message : ""));
    }

    return { provider: this.id, providerMessageId: payload.id ?? null };
  }
}
