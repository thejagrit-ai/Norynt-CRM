// src/modules/custom-reports/custom-reports.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CustomReportsController } from './custom-reports.controller';
import { CustomReportsService } from './custom-reports.service';
import { CustomReportsRepository } from './custom-reports.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CustomReportsController],
  providers: [CustomReportsService, CustomReportsRepository],
  exports: [CustomReportsService, CustomReportsRepository],
})
export class CustomReportsModule {}
