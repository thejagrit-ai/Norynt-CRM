// src/modules/accounting/accounting.module.ts — v3.2 muhasebe senkron modülü.
import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountingRepository } from './accounting.repository';

@Module({
  imports: [ConnectionsModule], // OAuthService + EXT_HTTP
  controllers: [AccountingController],
  providers: [AccountingService, AccountingRepository],
})
export class AccountingModule {}
