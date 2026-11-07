// Transactional email templates for one-time codes.
// Table-based layout with inline styles so it renders the same in Gmail, Outlook and Apple Mail.

export type OtpPurpose = 'EMAIL_VERIFY' | 'PASSWORD_RESET';

export interface OtpEmailInput {
  purpose: OtpPurpose;
  code: string;
  firstName?: string;
  expiresInMinutes: number;
  /** When true the logo is attached inline and referenced by cid. */
  hasLogo: boolean;
  supportEmail?: string;
}

export const LOGO_CID = 'norynt-mark@norynt';

const COPY: Record<
  OtpPurpose,
  { subject: string; preheader: string; title: string; lead: string; ignore: string }
> = {
  EMAIL_VERIFY: {
    subject: 'Your Norynt CRM verification code',
    preheader: 'Use this code to confirm your email address.',
    title: 'Confirm your email address',
    lead: 'Thanks for creating a Norynt CRM account. Enter this code on the verification screen to finish signing up.',
    ignore:
      'If you didn’t create a Norynt CRM account, you can ignore this email. No account will be activated.',
  },
  PASSWORD_RESET: {
    subject: 'Your Norynt CRM password reset code',
    preheader: 'Use this code to reset your password.',
    title: 'Reset your password',
    lead: 'We received a request to reset the password for your Norynt CRM account. Enter this code on the reset screen to choose a new one.',
    ignore:
      'If you didn’t ask to reset your password, you can ignore this email. Your password won’t change.',
  },
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderOtpEmail(input: OtpEmailInput): { subject: string; html: string; text: string } {
  const c = COPY[input.purpose];
  const name = input.firstName?.trim();
  const greeting = name ? `Hi ${esc(name)},` : 'Hi,';
  const spaced = input.code.split('').join(' ');
  const year = new Date().getFullYear();
  const support = input.supportEmail;

  const logo = input.hasLogo
    ? `<img src="cid:${LOGO_CID}" width="36" height="36" alt="" style="display:block;border:0;outline:none;" />`
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(c.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f6fb;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
      <tr><td style="padding:0 4px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;">${logo}</td>
          <td style="vertical-align:middle;padding-left:${input.hasLogo ? '10' : '0'}px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;letter-spacing:-0.3px;color:#17233b;">Norynt CRM</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#ffffff;border:1px solid #d6deeb;border-radius:14px;padding:36px 36px 32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#17233b;">
        <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.4px;color:#17233b;">${esc(c.title)}</h1>
        <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#17233b;">${greeting}</p>
        <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:#56627a;">${esc(c.lead)}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" style="background:#e7effd;border:1px solid #c3d5f7;border-radius:12px;padding:22px 12px;">
            <div style="font-family:'SF Mono',Consolas,'Courier New',monospace;font-size:36px;line-height:1;font-weight:700;letter-spacing:6px;color:#1a47ae;">${esc(spaced)}</div>
          </td>
        </tr></table>

        <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#56627a;">This code expires in <strong style="color:#17233b;">${input.expiresInMinutes} minutes</strong> and can be used once.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;"><tr>
          <td style="border-top:1px solid #e3e9f3;padding-top:20px;font-size:13px;line-height:1.6;color:#56627a;">
            <strong style="color:#17233b;">Keep this code private.</strong> Norynt staff will never ask you for it.<br />
            ${esc(c.ignore)}
          </td>
        </tr></table>
      </td></tr>
      <tr><td align="center" style="padding:22px 12px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#7a859b;">
        ${support ? `Need help? Contact <a href="mailto:${esc(support)}" style="color:#2158d6;text-decoration:none;">${esc(support)}</a><br />` : ''}
        This is an automated message, please don’t reply to it.<br />
        &copy; ${year} Norynt CRM
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    c.title,
    '',
    greeting.replace(/&amp;/g, '&'),
    c.lead,
    '',
    `Your code: ${input.code}`,
    `It expires in ${input.expiresInMinutes} minutes and can be used once.`,
    '',
    'Keep this code private. Norynt staff will never ask you for it.',
    c.ignore,
    '',
    '— Norynt CRM',
  ].join('\n');

  return { subject: c.subject, html, text };
}
