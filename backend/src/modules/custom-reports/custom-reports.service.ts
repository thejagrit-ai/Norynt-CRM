// src/modules/custom-reports/custom-reports.service.ts
import { Injectable } from '@nestjs/common';
import { CustomReportsRepository } from './custom-reports.repository';
import {
  CreateCustomReportDto,
  ExecuteReportDto,
} from './dto/custom-report.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class CustomReportsService {
  constructor(private readonly repo: CustomReportsRepository) {}

  async findAll(actor: AuthenticatedUser) {
    let reports = await this.repo.findAll(actor.tenantId);
    if (reports.length === 0) {
      const defaults = [
        {
          name: 'Deals Performance by Status',
          description: 'Summary breakdown of all open, won, and lost deals',
          entity: 'DEAL',
          metrics: ['count', 'sum_value'],
          groupBy: 'status',
          dateRange: 'this_quarter',
          chartType: 'BAR',
        },
        {
          name: 'Lead Intake Channels Distribution',
          description: 'Volume of incoming leads grouped by capture channel',
          entity: 'LEAD',
          metrics: ['count'],
          groupBy: 'channel',
          dateRange: 'all_time',
          chartType: 'PIE',
        },
        {
          name: 'Support Tickets by Priority',
          description: 'Internal ticket breakdown across urgency levels',
          entity: 'TICKET',
          metrics: ['count'],
          groupBy: 'priority',
          dateRange: 'this_month',
          chartType: 'DONUT',
        },
      ];
      reports = await Promise.all(
        defaults.map((d) => this.repo.create(d, actor.id, actor.tenantId)),
      );
    }
    return reports;
  }

  async create(dto: CreateCustomReportDto, actor: AuthenticatedUser) {
    return this.repo.create(dto, actor.id, actor.tenantId);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }

  async execute(dto: ExecuteReportDto, actor: AuthenticatedUser) {
    const rawData = await this.repo.fetchEntityData(dto.entity, actor.tenantId);
    const groupKey = dto.groupBy || 'status';

    const grouped: Record<
      string,
      { label: string; count: number; value: number }
    > = {};

    rawData.forEach((item: any) => {
      const key = String(item[groupKey] || 'Unassigned');
      if (!grouped[key]) {
        grouped[key] = { label: key, count: 0, value: 0 };
      }
      grouped[key].count += 1;
      if (item.value !== undefined && item.value !== null) {
        grouped[key].value += Number(item.value);
      } else if (item.total !== undefined && item.total !== null) {
        grouped[key].value += Number(item.total);
      }
    });

    const results = Object.values(grouped);
    return {
      entity: dto.entity,
      groupBy: groupKey,
      totalRecords: rawData.length,
      data: results,
      generatedAt: new Date(),
    };
  }
}
