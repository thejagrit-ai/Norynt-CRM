import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthMailService, OTP_TTL_MINUTES } from './mail/auth-mail.service';
import { OtpPurpose } from './mail/otp-templates';

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;
const INVALID_MSG = 'That code is incorrect or has expired. Check it and try again, or request a new one.';

/** Issues, emails and verifies short-lived 6-digit codes. Codes are stored hashed. */
@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: AuthMailService,
    private readonly config: ConfigService,
  ) {}

  private hash(email: string, purpose: OtpPurpose, code: string): string {
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    return createHmac('sha256', secret).update(`${email}|${purpose}|${code}`).digest('hex');
  }

  /** Creates a fresh code (invalidating older ones) and emails it. */
  async issue(email: string, purpose: OtpPurpose, firstName?: string): Promise<void> {
    const latest = await this.prisma.otpCode.findFirst({
      where: { email, purpose },
      orderBy: { createdAt: 'desc' },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
      throw new HttpException(
        `Please wait ${wait} seconds before requesting another code.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.$transaction([
      this.prisma.otpCode.deleteMany({ where: { email, purpose } }),
      this.prisma.otpCode.create({
        data: {
          email,
          purpose,
          codeHash: this.hash(email, purpose, code),
          expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
        },
      }),
    ]);
    await this.mail.sendOtp({ to: email, code, purpose, firstName });
  }

  /** Checks and consumes a code. Throws a generic 400 on any failure. */
  async consume(email: string, purpose: OtpPurpose, code: string): Promise<void> {
    const rec = await this.prisma.otpCode.findFirst({
      where: { email, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!rec) throw new BadRequestException(INVALID_MSG);

    // Atomically spend one attempt first; parallel guesses can't exceed the limit.
    const spent = await this.prisma.otpCode.updateMany({
      where: {
        id: rec.id,
        consumedAt: null,
        attempts: { lt: MAX_ATTEMPTS },
        expiresAt: { gt: new Date() },
      },
      data: { attempts: { increment: 1 } },
    });
    if (spent.count !== 1) throw new BadRequestException(INVALID_MSG);

    const given = Buffer.from(this.hash(email, purpose, code));
    const stored = Buffer.from(rec.codeHash);
    if (given.length !== stored.length || !timingSafeEqual(given, stored)) {
      throw new BadRequestException(INVALID_MSG);
    }

    // Single use: only one concurrent request can win the consume.
    const used = await this.prisma.otpCode.updateMany({
      where: { id: rec.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (used.count !== 1) throw new BadRequestException(INVALID_MSG);
  }
}
