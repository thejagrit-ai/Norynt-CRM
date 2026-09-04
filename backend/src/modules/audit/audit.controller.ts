// src/modules/audit/audit.controller.ts
import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Permissions(PERMISSIONS.AUDIT.READ)
  async list(@Query() query: AuditQueryDto) {
    return this.service.list(query);
  }

  @Get('stats')
  @Permissions(PERMISSIONS.AUDIT.READ)
  async stats() {
    return this.service.getStats();
  }

  @Get('export')
  @Permissions(PERMISSIONS.AUDIT.READ)
  async export(
    @Query() query: AuditQueryDto,
    @Query('format') format: 'csv' | 'json',
    @Res() res: Response,
  ) {
    const result = await this.service.exportLogs(query, format || 'json');
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit_logs_${Date.now()}.csv"`,
      );
      return res.send(result);
    }
    return res.json(result);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.AUDIT.READ)
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }
}
