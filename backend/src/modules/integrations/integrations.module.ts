// src/modules/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { IntegrationsRepository } from './integrations.repository';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { WebhookEventHandler } from './webhook-event.handler';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail/mail.service';
import { MAIL_PROVIDER } from './mail/mail-provider.interface';
import { SimulatedMailProvider } from './mail/providers/simulated-mail.provider';
import { SmtpMailProvider } from './mail/providers/smtp-mail.provider';
import { HTTP_CLIENT } from './http/http-client.interface';
import { FetchHttpClient } from './http/fetch-http.client';

import { AuditModule } from '../audit/audit.module';
import { MailController } from './mail/mail.controller';

@Module({
  imports: [AuditModule],
  controllers: [IntegrationsController, MailController],
  providers: [
    IntegrationsService,
    IntegrationsRepository,
    WebhookDispatcherService,
    WebhookEventHandler,
    MailService,
    SimulatedMailProvider,
    SmtpMailProvider,
    // Provider selection: defaults to SMTP (or fallback to simulated in offline dev)
    {
      provide: MAIL_PROVIDER,
      inject: [ConfigService, SimulatedMailProvider, SmtpMailProvider],
      useFactory: (
        config: ConfigService,
        sim: SimulatedMailProvider,
        smtp: SmtpMailProvider,
      ) => (config.get<string>('MAIL_DRIVER') === 'simulated' ? sim : smtp),
    },
    { provide: HTTP_CLIENT, useClass: FetchHttpClient },
  ],
  exports: [IntegrationsService, MailService],
})
export class IntegrationsModule {}
