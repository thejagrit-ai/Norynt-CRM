// src/modules/approvals/approvals.module.ts
import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalsRepository } from './approvals.repository';
import { TasksModule } from '../tasks/tasks.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [TasksModule, WhatsAppModule, IntegrationsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsRepository, ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
