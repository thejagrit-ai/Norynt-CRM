// src/modules/integrations/mail/mail-provider.interface.ts
// Sağlayıcı soyutlaması (DIP): tüketiciler arayüze bağımlı, somut sınıfa değil.
export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');

export interface MailInput {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface IMailProvider {
  readonly driver: string;
  send(input: MailInput): Promise<void>;
}
