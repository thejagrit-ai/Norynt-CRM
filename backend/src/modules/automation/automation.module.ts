// src/modules/automation/automation.module.ts
import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationRepository } from './automation.repository';
import { AutomationEngine } from './automation.engine';
import { IntegrationsModule } from '../integrations/integrations.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { TasksModule } from '../tasks/tasks.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [IntegrationsModule, WhatsAppModule, TasksModule, ApprovalsModule],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationRepository, AutomationEngine],
  exports: [AutomationService],
})
export class AutomationModule {}
