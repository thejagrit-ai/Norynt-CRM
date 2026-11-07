// Writes the OTP email templates to ./email-previews so they can be opened in a browser.
// Run: npx ts-node scripts/render-email-previews.ts
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { renderOtpEmail } from '../src/modules/auth/mail/otp-templates';

const dir = join(__dirname, '..', 'email-previews');
mkdirSync(dir, { recursive: true });
for (const purpose of ['EMAIL_VERIFY', 'PASSWORD_RESET'] as const) {
  const { html } = renderOtpEmail({
    purpose,
    code: '482913',
    firstName: 'Jagrit',
    expiresInMinutes: 10,
    hasLogo: false,
    supportEmail: 'support@norynt.app',
  });
  // Browser preview: swap the inline (cid) logo for the local file.
  const preview = html.replace(
    '<td style="vertical-align:middle;"></td>',
    '<td style="vertical-align:middle;"><img src="../assets/norynt-mark.png" width="36" height="36" alt="" /></td>',
  );
  writeFileSync(join(dir, `${purpose.toLowerCase()}.html`), preview);
}
console.log('Wrote previews to', dir);
