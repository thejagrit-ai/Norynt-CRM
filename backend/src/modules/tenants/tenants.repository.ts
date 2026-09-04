// src/modules/tenants/tenants.repository.ts
// VERİ ERİŞİMİ: Prisma çağrıları YALNIZCA burada. Tenant/User platform kapsamı (scope yok).
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TenantCreateInput) {
    return this.prisma.tenant.create({ data });
  }

  findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  list() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  userExists(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true } });
  }

  assignUser(userId: string, tenantId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { tenantId },
      select: { id: true, email: true, tenantId: true },
    });
  }
}
