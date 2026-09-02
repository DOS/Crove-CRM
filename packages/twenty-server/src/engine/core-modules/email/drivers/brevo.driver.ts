import { Logger } from '@nestjs/common';

import axios from 'axios';
import { type SendMailOptions } from 'nodemailer';

import { type EmailDriverInterface } from 'src/engine/core-modules/email/drivers/interfaces/email-driver.interface';

export class BrevoDriver implements EmailDriverInterface {
  private readonly logger = new Logger(BrevoDriver.name);

  constructor(
    private readonly apiKey: string,
    private readonly defaultFromAddress?: string,
    private readonly defaultFromName?: string,
  ) {}

  async send(sendMailOptions: SendMailOptions): Promise<void> {
    try {
      const toRecipients = this.parseRecipients(sendMailOptions.to);
      const sender = this.parseSender(sendMailOptions.from);

      if (toRecipients.length === 0) {
        this.logger.warn('No valid recipients provided for Brevo email dispatch.');
        return;
      }

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender,
          to: toRecipients,
          subject: sendMailOptions.subject ?? 'Notification',
          htmlContent:
            typeof sendMailOptions.html === 'string'
              ? sendMailOptions.html
              : typeof sendMailOptions.text === 'string'
                ? `<p>${sendMailOptions.text.replace(/\n/g, '<br/>')}</p>`
                : '<p></p>',
          textContent:
            typeof sendMailOptions.text === 'string'
              ? sendMailOptions.text
              : undefined,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10_000,
        },
      );

      this.logger.log(
        `Email to '${JSON.stringify(toRecipients)}' successfully sent via Brevo API (status: ${response.status})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to '${JSON.stringify(sendMailOptions.to)}' via Brevo API: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private parseRecipients(
    to: SendMailOptions['to'],
  ): Array<{ email: string; name?: string }> {
    if (!to) return [];

    if (Array.isArray(to)) {
      return to
        .map((recipient) => {
          if (typeof recipient === 'string') {
            return { email: recipient.trim() };
          }
          if (recipient && typeof recipient === 'object' && 'address' in recipient) {
            return { email: recipient.address, name: recipient.name };
          }
          return null;
        })
        .filter((r): r is { email: string; name?: string } => Boolean(r && r.email));
    }

    if (typeof to === 'string') {
      return to
        .split(',')
        .map((e) => ({ email: e.trim() }))
        .filter((r) => Boolean(r.email));
    }

    if (typeof to === 'object' && 'address' in to) {
      return [{ email: to.address, name: to.name }];
    }

    return [];
  }

  private parseSender(
    from: SendMailOptions['from'],
  ): { email: string; name?: string } {
    if (typeof from === 'string') {
      const match = from.match(/^(.*?)\s*<(.+@.+)>$/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }
      return { email: from.trim() };
    }

    if (from && typeof from === 'object' && 'address' in from) {
      return { email: from.address, name: from.name };
    }

    return {
      email: this.defaultFromAddress || 'crm@crove.com',
      name: this.defaultFromName || 'Crove CRM',
    };
  }
}
