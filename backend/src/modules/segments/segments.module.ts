// src/modules/segments/segments.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { SegmentsRepository } from './segments.repository';

@Module({
  imports: [PrismaModule],
  controllers: [SegmentsController],
  providers: [SegmentsService, SegmentsRepository],
  exports: [SegmentsService, SegmentsRepository],
})
export class SegmentsModule {}
