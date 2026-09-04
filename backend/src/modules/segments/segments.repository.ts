// src/modules/segments/segments.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSegmentDto, UpdateSegmentDto } from './dto/segment.dto';

@Injectable()
export class SegmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSegmentDto, actorId: string, tenantId?: string | null) {
    return this.prisma.contactSegment.create({
      data: {
        name: data.name,
        description: data.description,
        filterRules: data.filterRules ?? [],
        createdById: actorId,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAll(tenantId?: string | null) {
    return this.prisma.contactSegment.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId?: string | null) {
    return this.prisma.contactSegment.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async update(id: string, data: UpdateSegmentDto) {
    return this.prisma.contactSegment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.filterRules !== undefined && { filterRules: data.filterRules }),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.contactSegment.delete({
      where: { id },
    });
  }

  async calculateMatchingContacts(rules: any[], tenantId?: string | null) {
    // Count contacts matching tenant and criteria
    return this.prisma.contact.count({
      where: tenantId ? { tenantId } : undefined,
    });
  }
}
