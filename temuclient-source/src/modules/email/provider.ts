import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/observability/logger";
import { renderEmailTemplate, type EmailTemplateInput } from "@/modules/email/templates";

export interface TransactionalEmailProvider { readonly name: string; send(input: { to: string; template: EmailTemplateInput }): Promise<{ id: string; mode: "log" | "live" }>; }

class LogEmailProvider implements TransactionalEmailProvider {
  readonly name = "log";
  async send(input: { to: string; template: EmailTemplateInput }) {
    const id = crypto.randomUUID();
    logger.info("transactional_email_simulated", { id, template: input.template.type, recipientDomain: input.to.split("@")[1] });
    return { id, mode: "log" as const };
  }
}

class ResendEmailProvider implements TransactionalEmailProvider {
  readonly name = "resend";
  constructor(private readonly apiKey: string, private readonly from: string) {}
  async send(input: { to: string; template: EmailTemplateInput }) {
    const content = renderEmailTemplate(input.template);
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ from: this.from, to: [input.to], subject: content.subject, text: content.text }) });
    if (!response.ok) throw new Error(`Transactional email provider returned ${response.status}`);
    const payload = await response.json() as { id: string };
    return { id: payload.id, mode: "live" as const };
  }
}

export function getEmailProvider(): TransactionalEmailProvider {
  const env = getServerEnv();
  return env.EMAIL_PROVIDER === "resend" && env.RESEND_API_KEY ? new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM) : new LogEmailProvider();
}

export async function sendTransactionalEmail(to: string, template: EmailTemplateInput) {
  return getEmailProvider().send({ to, template });
}
