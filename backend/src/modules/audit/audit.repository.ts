// src/modules/audit/audit.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AuditLogCreateInput) {
    return this.prisma.auditLog.create({ data });
  }

  async list(where: Prisma.AuditLogWhereInput, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  async getStats() {
    const [total, past24h, criticalActions] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: 'DELETE' } },
            { action: { contains: 'AUTH_FAILED' } },
            { statusCode: { gte: 400 } },
          ],
        },
      }),
    ]);
    return { total, past24h, criticalActions };
  }
}
