import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { LOGO_CID, OtpPurpose, renderOtpEmail } from './otp-templates';

export const OTP_TTL_MINUTES = 10;

/**
 * Sends authentication emails over SMTP (Brevo: smtp-relay.brevo.com:587).
 * Without SMTP credentials it runs in console mode: the code is printed to the
 * server log (never in production) so the flow can be tested locally.
 */
@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private get smtpReady(): boolean {
    return (
      this.config.get<string>('MAIL_DRIVER') === 'smtp' &&
      !!this.config.get<string>('SMTP_HOST') &&
      !!this.config.get<string>('SMTP_USER') &&
      !!this.config.get<string>('SMTP_PASS')
    );
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const port = Number(this.config.get<number>('SMTP_PORT', 587));
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port,
        // 465 = implicit TLS; 587 (Brevo default) = STARTTLS.
        secure: port === 465,
        requireTLS: port !== 465,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
    }
    return this.transporter;
  }

  private loadLogo(): Buffer | null {
    const candidates = [
      join(process.cwd(), 'assets', 'norynt-mark.png'),
      join(__dirname, '..', '..', '..', '..', 'assets', 'norynt-mark.png'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) return readFileSync(p);
    }
    return null;
  }

  async sendOtp(params: {
    to: string;
    code: string;
    purpose: OtpPurpose;
    firstName?: string;
  }): Promise<void> {
    const logo = this.loadLogo();
    const mail = renderOtpEmail({
      purpose: params.purpose,
      code: params.code,
      firstName: params.firstName,
      expiresInMinutes: OTP_TTL_MINUTES,
      hasLogo: !!logo,
      supportEmail: this.config.get<string>('SUPPORT_EMAIL') || undefined,
    });

    if (!this.smtpReady) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new Error(
          'Email is not configured: set MAIL_DRIVER=smtp and SMTP_HOST/SMTP_USER/SMTP_PASS.',
        );
      }
      this.logger.warn(
        `[console mail] ${params.purpose} code for ${params.to}: ${params.code}  (set MAIL_DRIVER=smtp + Brevo credentials to send real email)`,
      );
      return;
    }

    const fromAddr =
      this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER')!;
    const fromName = this.config.get<string>('SMTP_FROM_NAME') || 'Norynt CRM';

    await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: params.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: logo
        ? [{ filename: 'norynt-mark.png', content: logo, cid: LOGO_CID, contentType: 'image/png' }]
        : [],
    });
    this.logger.log(`OTP email sent purpose=${params.purpose} to=${params.to}`);
  }
}
