export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  tags?: Record<string, string>;
};

export type SentEmail = {
  provider: string;
  providerMessageId: string | null;
};

export interface EmailProvider {
  readonly id: string;
  send(message: EmailMessage): Promise<SentEmail>;
}
