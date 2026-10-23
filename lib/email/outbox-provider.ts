import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getAppConfig } from "@/lib/config";
import type { EmailMessage, EmailProvider, SentEmail } from "@/lib/email/types";

export class OutboxEmailProvider implements EmailProvider {
  readonly id = "outbox";
  private readonly directory: string;

  constructor() {
    const config = getAppConfig();
    this.directory = path.resolve(process.cwd(), config.storage.dataDir, "outbox");
  }

  async send(message: EmailMessage): Promise<SentEmail> {
    await fs.mkdir(this.directory, { recursive: true });
    const id = randomUUID();
    const record = {
      id,
      createdAt: new Date().toISOString(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      tags: message.tags ?? {},
      delivery: "local_outbox",
    };
    const file = path.join(this.directory, id + ".json");
    await fs.writeFile(file, JSON.stringify(record, null, 2), { encoding: "utf8", mode: 0o600 });
    return { provider: this.id, providerMessageId: id };
  }
}
