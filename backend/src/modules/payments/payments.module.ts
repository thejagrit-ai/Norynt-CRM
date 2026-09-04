// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import {
  EXT_HTTP,
  FetchExtHttpClient,
} from '../../common/http/ext-http.client';
import { ConnectionsModule } from '../connections/connections.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AuditModule } from '../audit/audit.module';
import { PaymentsController } from './payments.controller';
import { PaymentsPublicController } from './payments.public.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';

@Module({
  imports: [ConnectionsModule, InvoicesModule, IntegrationsModule, AuditModule],
  controllers: [PaymentsController, PaymentsPublicController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    { provide: EXT_HTTP, useClass: FetchExtHttpClient },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
