// src/modules/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditRepository } from './audit.repository';
import { AuditQueryDto } from './dto/audit-query.dto';
import { redactSecrets } from '../../common/utils/secret-redaction.util';

export interface AuditEntry {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  description?: string | null;
  path?: string;
  statusCode?: number;
  ip?: string | null;
  userAgent?: string | null;
  before?: any;
  after?: any;
  metadata?: any;
  tenantId?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly repo: AuditRepository) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      const sanitizedBefore = entry.before
        ? redactSecrets(entry.before)
        : undefined;
      const sanitizedAfter = entry.after
        ? redactSecrets(entry.after)
        : undefined;
      const sanitizedMetadata = entry.metadata
        ? redactSecrets(entry.metadata)
        : undefined;

      await this.repo.create({
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        description: entry.description ?? null,
        path: entry.path ?? null,
        statusCode: entry.statusCode ?? 200,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        before: sanitizedBefore ?? Prisma.DbNull,
        after: sanitizedAfter ?? Prisma.DbNull,
        metadata: sanitizedMetadata ?? Prisma.DbNull,
        tenantId: entry.tenantId ?? null,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to write audit entry: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async list(params: AuditQueryDto) {
    const page = params.page || 1;
    const limit = params.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (params.entity)
      where.entity = { equals: params.entity, mode: 'insensitive' };
    if (params.action)
      where.action = { contains: params.action, mode: 'insensitive' };
    if (params.actorId) where.actorId = params.actorId;
    if (params.actorEmail)
      where.actorEmail = { contains: params.actorEmail, mode: 'insensitive' };

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    if (params.q) {
      const query = params.q.trim();
      where.OR = [
        { action: { contains: query, mode: 'insensitive' } },
        { entity: { contains: query, mode: 'insensitive' } },
        { entityId: { contains: query, mode: 'insensitive' } },
        { actorEmail: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { ip: { contains: query, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.repo.list(where, skip, limit);
    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async getStats() {
    return this.repo.getStats();
  }

  async exportLogs(params: AuditQueryDto, format: 'csv' | 'json' = 'json') {
    const where: Prisma.AuditLogWhereInput = {};
    if (params.entity) where.entity = params.entity;
    if (params.action)
      where.action = { contains: params.action, mode: 'insensitive' };
    if (params.actorEmail)
      where.actorEmail = { contains: params.actorEmail, mode: 'insensitive' };

    const { items } = await this.repo.list(where, 0, 1000);

    if (format === 'csv') {
      const headers = [
        'ID',
        'Timestamp',
        'Actor Email',
        'Role',
        'Action',
        'Entity',
        'Entity ID',
        'Status Code',
        'IP',
        'Description',
      ];
      const rows = items.map((l) => [
        l.id,
        l.createdAt.toISOString(),
        `"${(l.actorEmail || 'System').replace(/"/g, '""')}"`,
        l.actorRole || '',
        `"${l.action.replace(/"/g, '""')}"`,
        l.entity,
        l.entityId || '',
        l.statusCode || '',
        l.ip || '',
        `"${(l.description || '').replace(/"/g, '""')}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    return items;
  }
}
