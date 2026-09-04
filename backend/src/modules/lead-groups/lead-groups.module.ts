// src/modules/lead-groups/lead-groups.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeadGroupsController } from './lead-groups.controller';
import { LeadGroupsService } from './lead-groups.service';
import { LeadGroupsRepository } from './lead-groups.repository';

@Module({
  imports: [PrismaModule],
  controllers: [LeadGroupsController],
  providers: [LeadGroupsService, LeadGroupsRepository],
  exports: [LeadGroupsService, LeadGroupsRepository],
})
export class LeadGroupsModule {}
