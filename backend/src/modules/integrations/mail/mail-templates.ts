// src/modules/integrations/mail/mail-templates.ts
// Enterprise Email Templates with multi-language & multi-currency support.

type Ctx = Record<string, unknown>;

interface Template {
  subject: (c: Ctx) => string;
  text: (c: Ctx) => string;
}

const s = (c: Ctx, k: string, d = ''): string =>
  c[k] === undefined || c[k] === null ? d : String(c[k]);

export const MAIL_TEMPLATES: Record<string, Template> = {
  welcome: {
    subject: () => 'Welcome to Norynt CRM',
    text: (c) =>
      `Hello ${s(c, 'firstName', 'there')},\n\nYour Norynt CRM account has been created successfully.\nYou can now log in and access your workspace.\n\nBest regards,\nThe Norynt CRM Team`,
  },
  'password.reset': {
    subject: () => 'Norynt CRM — Password Reset Request',
    text: (c) =>
      `Hello ${s(c, 'firstName', 'there')},\n\nWe received a request to reset your password. Use the following link to reset your credentials:\n${s(c, 'resetUrl')}\n\nIf you did not request this, you can safely ignore this email.`,
  },
  'deal.won': {
    subject: (c) => `Deal Won: ${s(c, 'title')}`,
    text: (c) =>
      `Congratulations! The deal "${s(c, 'title')}" has been marked as WON for a total value of ${s(c, 'currency', 'INR')} ${s(c, 'value', '0')}.\n\nView details in your CRM dashboard.`,
  },
  'lead.assigned': {
    subject: () => 'New Lead Assigned to You',
    text: (c) =>
      `A new lead has been assigned to you: ${s(c, 'firstName')} ${s(c, 'lastName')} (${s(c, 'companyName', 'Direct Inbound')}).\n\nPlease reach out within your team SLA window.`,
  },
  'invoice.issued': {
    subject: (c) => `Invoice #${s(c, 'number')} from Norynt CRM`,
    text: (c) =>
      `Dear ${s(c, 'customerName')},\n\nInvoice #${s(c, 'number')} has been generated. Total Amount: ${s(c, 'currency', 'INR')} ${s(c, 'total', '0')}.\nDue Date: ${s(c, 'dueAt', 'Upon Receipt')}.\n\nThank you for your business!`,
  },
  'payment.success': {
    subject: (c) => `Payment Received for Invoice #${s(c, 'invoiceNumber')}`,
    text: (c) =>
      `Dear ${s(c, 'customerName', 'Customer')},\n\nWe have successfully received your payment of ${s(c, 'currency', 'INR')} ${s(c, 'amount', '0')} via ${s(c, 'provider', 'Payment Gateway')} (Ref: ${s(c, 'paymentId', 'N/A')}).\n\nYour invoice #${s(c, 'invoiceNumber')} is now marked as PAID.`,
  },
  'payment.failed': {
    subject: (c) => `Payment Failed for Invoice #${s(c, 'invoiceNumber')}`,
    text: (c) =>
      `Dear ${s(c, 'customerName', 'Customer')},\n\nYour attempt to pay ${s(c, 'currency', 'INR')} ${s(c, 'amount', '0')} for invoice #${s(c, 'invoiceNumber')} was not successful (${s(c, 'reason', 'Declined by bank')}).\n\nPlease retry or update your payment method.`,
  },
  'refund.processed': {
    subject: (c) => `Refund Processed for Invoice #${s(c, 'invoiceNumber')}`,
    text: (c) =>
      `Dear ${s(c, 'customerName', 'Customer')},\n\nA refund of ${s(c, 'currency', 'INR')} ${s(c, 'amount', '0')} has been initiated for transaction ${s(c, 'paymentId')}.\nPlease allow 3-5 business days for the funds to reflect in your account.`,
  },
  'smtp.test': {
    subject: () => 'Norynt CRM — SMTP Configuration Test',
    text: (c) =>
      `Hello!\n\nThis is a test email sent from your Norynt CRM instance to verify your SMTP server configuration.\n\nServer: ${s(c, 'host')}\nPort: ${s(c, 'port')}\nSecurity: ${s(c, 'encryption', 'TLS')}\nSender: ${s(c, 'from')}\nTimestamp: ${new Date().toISOString()}\n\nYour email delivery system is functioning properly!`,
  },
};

export function renderTemplate(
  templateKey: string,
  context: Ctx,
): { subject: string; text: string } {
  const tpl = MAIL_TEMPLATES[templateKey];
  if (!tpl) {
    throw new Error(`Unknown email template: ${templateKey}`);
  }
  return { subject: tpl.subject(context), text: tpl.text(context) };
}
