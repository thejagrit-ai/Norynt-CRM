// Sends a real OTP email using the SMTP settings in .env.  Usage: npx ts-node scripts/send-test-mail.ts <to> [EMAIL_VERIFY|PASSWORD_RESET]
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { AuthMailService } from '../src/modules/auth/mail/auth-mail.service';

(async () => {
  const to = process.argv[2];
  const purpose = (process.argv[3] as 'EMAIL_VERIFY' | 'PASSWORD_RESET') || 'EMAIL_VERIFY';
  if (!to) throw new Error('Usage: ts-node scripts/send-test-mail.ts <to> [purpose]');
  const config = new ConfigService(process.env as any);
  await new AuthMailService(config).sendOtp({ to, purpose, code: '482913', firstName: 'Jagrit' });
  console.log(`Sent ${purpose} test email to ${to}`);
})().catch((e) => {
  console.error('SEND FAILED:', e.message);
  process.exit(1);
});
