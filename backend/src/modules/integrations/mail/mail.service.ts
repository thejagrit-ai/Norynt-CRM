// src/modules/integrations/mail/mail.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IMailProvider,
  MAIL_PROVIDER,
  MailInput,
} from './mail-provider.interface';
import { renderTemplate } from './mail-templates';
import { SmtpConfig, SmtpMailProvider } from './providers/smtp-mail.provider';
import { redactSecrets } from '../../../common/utils/secret-redaction.util';

export interface EmailSettingsDto {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from: string;
  fromName?: string;
  replyTo?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(MAIL_PROVIDER) private readonly provider: IMailProvider,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.loadSavedSmtpSettings();
  }

  private async loadSavedSmtpSettings() {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'smtp_config' },
      });
      if (setting && setting.value && typeof setting.value === 'object') {
        const val = setting.value as unknown as SmtpConfig;
        if (this.provider instanceof SmtpMailProvider) {
          this.provider.updateConfig(val);
          this.logger.log(
            `Loaded custom SMTP settings for ${val.host}:${val.port}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `Could not load saved SMTP configuration: ${err.message}`,
      );
    }
  }

  async getSettings() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'smtp_config' },
    });

    const val = (setting?.value as Record<string, any>) || {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      from: process.env.SMTP_FROM || 'crm@norynt.dev',
      fromName: 'Norynt CRM',
      replyTo: process.env.SMTP_FROM || 'support@norynt.dev',
    };

    return {
      host: val.host,
      port: val.port,
      secure: Boolean(val.secure),
      user: val.user,
      hasPassword: Boolean(val.pass || process.env.SMTP_PASS),
      from: val.from,
      fromName: val.fromName || 'Norynt CRM',
      replyTo: val.replyTo || val.from,
      driver: this.provider.driver,
    };
  }

  async updateSettings(dto: EmailSettingsDto, updatedBy?: string) {
    let finalPass = dto.pass;
    if (!finalPass) {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { key: 'smtp_config' },
      });
      finalPass = (existing?.value as any)?.pass || process.env.SMTP_PASS;
    }

    const configToSave: SmtpConfig = {
      host: dto.host,
      port: Number(dto.port),
      secure: dto.secure ?? Number(dto.port) === 465,
      user: dto.user,
      pass: finalPass,
      from: dto.from,
      fromName: dto.fromName,
      replyTo: dto.replyTo,
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'smtp_config' },
      create: {
        key: 'smtp_config',
        value: configToSave as any,
        updatedBy,
      },
      update: {
        value: configToSave as any,
        updatedBy,
      },
    });

    if (this.provider instanceof SmtpMailProvider) {
      this.provider.updateConfig(configToSave);
    }

    return this.getSettings();
  }

  async testConnection(override?: SmtpConfig) {
    if (this.provider instanceof SmtpMailProvider) {
      return this.provider.verify(override);
    }
    return {
      success: true,
      message: 'Simulated mail provider active and ready.',
    };
  }

  async sendTestEmail(to: string) {
    this.assertNoCrlf(to, 'to');

    const settings = await this.getSettings();
    await this.sendTemplate(to, 'smtp.test', {
      host: settings.host,
      port: settings.port,
      encryption: settings.secure ? 'SSL (465)' : 'TLS/STARTTLS (587)',
      from: settings.from,
    });

    return {
      success: true,
      message: `Test email successfully dispatched to ${to}`,
      recipient: to,
    };
  }

  async sendTemplate(
    to: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const { subject } = renderTemplate(template, context);
    await this.send({ to, subject, template, context });
  }

  async send(input: MailInput): Promise<void> {
    this.assertNoCrlf(input.to, 'to');
    this.assertNoCrlf(input.subject, 'subject');

    try {
      await this.provider.send(input);
      await this.prisma.emailLog.create({
        data: {
          to: input.to,
          subject: input.subject,
          template: input.template,
          status: this.provider.driver === 'simulated' ? 'SIMULATED' : 'SENT',
        },
      });
    } catch (err: any) {
      await this.prisma.emailLog.create({
        data: {
          to: input.to,
          subject: input.subject,
          template: input.template,
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown mail error',
        },
      });
      throw err;
    }
  }

  private assertNoCrlf(value: string, field: string): void {
    if (/[\r\n]/.test(value)) {
      throw new BadRequestException(
        `${field}: Invalid newline characters (CRLF injection prevented).`,
      );
    }
  }
}
