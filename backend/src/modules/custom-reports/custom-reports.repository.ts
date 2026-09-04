// src/modules/custom-reports/custom-reports.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomReportDto } from './dto/custom-report.dto';

@Injectable()
export class CustomReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCustomReportDto, actorId: string, tenantId?: string | null) {
    return this.prisma.customReportDef.create({
      data: {
        name: data.name,
        description: data.description,
        entity: data.entity,
        metrics: data.metrics ?? ['count'],
        groupBy: data.groupBy || 'status',
        dateRange: data.dateRange || 'this_month',
        chartType: data.chartType || 'BAR',
        createdById: actorId,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAll(tenantId?: string | null) {
    return this.prisma.customReportDef.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.customReportDef.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return this.prisma.customReportDef.delete({ where: { id } });
  }

  async fetchEntityData(entity: string, tenantId?: string | null) {
    switch (entity.toUpperCase()) {
      case 'DEAL':
        return this.prisma.deal.findMany({
          where: tenantId ? { tenantId } : undefined,
          select: { id: true, title: true, status: true, value: true, currency: true, createdAt: true },
        });
      case 'LEAD':
        return this.prisma.lead.findMany({
          where: tenantId ? { tenantId } : undefined,
          select: { id: true, firstName: true, lastName: true, status: true, channel: true, createdAt: true },
        });
      case 'INVOICE':
        return this.prisma.invoice.findMany({
          where: tenantId ? { tenantId } : undefined,
          select: { id: true, number: true, status: true, total: true, subtotal: true, createdAt: true },
        });
      case 'TICKET':
        return this.prisma.ticket.findMany({
          where: tenantId ? { tenantId } : undefined,
          select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true },
        });
      default:
        return this.prisma.contact.findMany({
          where: tenantId ? { tenantId } : undefined,
          select: { id: true, firstName: true, lastName: true, roleType: true, createdAt: true },
        });
    }
  }
}
