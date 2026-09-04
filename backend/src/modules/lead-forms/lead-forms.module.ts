// src/modules/lead-forms/lead-forms.module.ts — Lead intake (embed form + webhook) modülü.
import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { LeadFormsController } from './lead-forms.controller';
import { LeadFormsPublicController } from './lead-forms.public.controller';
import { LeadFormsService } from './lead-forms.service';
import { LeadFormsRepository } from './lead-forms.repository';

@Module({
  imports: [LeadsModule],
  controllers: [LeadFormsController, LeadFormsPublicController],
  providers: [LeadFormsService, LeadFormsRepository],
  exports: [LeadFormsService],
})
export class LeadFormsModule {}
