// src/modules/api-keys/api-keys.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiKey } from '@prisma/client';

@Injectable()
export class ApiKeysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    prefix: string;
    keyHash: string;
    scopes: string[];
    tenantId?: string;
    createdById: string;
    expiresAt?: Date | null;
  }): Promise<ApiKey> {
    return this.prisma.apiKey.create({ data });
  }

  async findMany(tenantId?: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        tenantId: true,
        createdById: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({
      where: { keyHash },
    });
  }

  async delete(id: string, _tenantId?: string): Promise<ApiKey> {
    return this.prisma.apiKey.delete({
      where: { id },
    });
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
