// src/prisma/prisma.service.ts
// PrismaClient yaşam döngüsü + MERKEZİ tenant filtresi (multi-tenancy güvenlik kuralı).
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  getCurrentTenantId,
  TENANT_MODELS,
} from '../common/tenant/tenant-context';

const READ_ACTIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'updateMany',
  'deleteMany',
]);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
    // Tenant bağlamı aktifse, tenant kapsamlı modellere otomatik tenantId enjekte edilir.
    // Geliştiricinin elle yazmasına bırakılmaz (unutma = veri sızıntısı).
    this.$use(async (params, next) => {
      const tenantId = getCurrentTenantId();
      if (tenantId && params.model && TENANT_MODELS.has(params.model)) {
        this.applyTenantScope(params, tenantId);
      }
      return next(params);
    });
  }

  private applyTenantScope(
    params: { action: string; args?: Record<string, unknown> },
    tenantId: string,
  ): void {
    const action = params.action;
    params.args = params.args ?? {};

    if (action === 'create') {
      params.args.data = { ...(params.args.data as object), tenantId };
      return;
    }
    if (action === 'createMany') {
      const data = params.args.data;
      params.args.data = Array.isArray(data)
        ? data.map((d) => ({ ...(d as object), tenantId }))
        : { ...(data as object), tenantId };
      return;
    }
    // findUnique non-unique alanla çalışmaz → findFirst'e çevir.
    if (action === 'findUnique' || action === 'findUniqueOrThrow') {
      params.action =
        action === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
    }
    if (
      READ_ACTIONS.has(params.action) ||
      action === 'update' ||
      action === 'delete' ||
      action === 'findUnique' ||
      action === 'findUniqueOrThrow'
    ) {
      params.args.where = {
        ...((params.args.where as object) ?? {}),
        tenantId,
      };
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
