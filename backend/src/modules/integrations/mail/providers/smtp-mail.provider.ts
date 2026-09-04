// src/modules/integrations/mail/providers/smtp-mail.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailProvider, MailInput } from '../mail-provider.interface';
import { renderTemplate } from '../mail-templates';

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  timeoutMs?: number;
}

@Injectable()
export class SmtpMailProvider implements IMailProvider {
  readonly driver = 'smtp';
  private readonly logger = new Logger(SmtpMailProvider.name);
  private transporter: nodemailer.Transporter | null = null;
  private currentConfig: SmtpConfig | null = null;

  constructor(private readonly config: ConfigService) {}

  updateConfig(newConfig: SmtpConfig) {
    this.currentConfig = newConfig;
    this.transporter = null; // force recreate
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host =
        this.currentConfig?.host ||
        this.config.get<string>('SMTP_HOST', 'localhost');
      const port =
        this.currentConfig?.port || this.config.get<number>('SMTP_PORT', 1025);
      const secure =
        this.currentConfig?.secure !== undefined
          ? this.currentConfig.secure
          : this.config.get<boolean>('SMTP_SECURE', false) || port === 465;
      const user =
        this.currentConfig?.user || this.config.get<string>('SMTP_USER');
      const pass =
        this.currentConfig?.pass || this.config.get<string>('SMTP_PASS');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
        connectionTimeout: this.currentConfig?.timeoutMs || 10000,
      });
    }
    return this.transporter;
  }

  async verify(
    overrideConfig?: SmtpConfig,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const transport = overrideConfig
        ? nodemailer.createTransport({
            host: overrideConfig.host,
            port: overrideConfig.port,
            secure: overrideConfig.secure ?? overrideConfig.port === 465,
            auth:
              overrideConfig.user && overrideConfig.pass
                ? { user: overrideConfig.user, pass: overrideConfig.pass }
                : undefined,
            connectionTimeout: overrideConfig.timeoutMs || 10000,
          })
        : this.getTransporter();

      await transport.verify();
      return {
        success: true,
        message: 'SMTP server handshake and credentials verified successfully.',
      };
    } catch (err: any) {
      this.logger.warn(`SMTP verification failed: ${err.message}`);
      return {
        success: false,
        message: `SMTP verification failed: ${err.message || 'Connection refused or invalid credentials'}`,
      };
    }
  }

  async send(input: MailInput): Promise<void> {
    const { text } = renderTemplate(input.template, input.context);
    const fromAddr =
      this.currentConfig?.from ||
      this.config.get<string>('SMTP_FROM', 'crm@norynt.dev');
    const fromName = this.currentConfig?.fromName || 'Norynt CRM';

    await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: input.to,
      subject: input.subject,
      text,
    });
    this.logger.log(
      `SMTP email sent successfully template=${input.template} to=${input.to}`,
    );
  }
}
