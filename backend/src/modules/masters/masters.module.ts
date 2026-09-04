// src/modules/masters/masters.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MastersController } from './masters.controller';
import { MastersService } from './masters.service';
import { MastersRepository } from './masters.repository';

@Module({
  imports: [PrismaModule],
  controllers: [MastersController],
  providers: [MastersService, MastersRepository],
  exports: [MastersService, MastersRepository],
})
export class MastersModule {}
