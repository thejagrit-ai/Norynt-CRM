// src/modules/lead-groups/lead-groups.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadGroupDto, UpdateLeadGroupDto } from './dto/lead-group.dto';

@Injectable()
export class LeadGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateLeadGroupDto,
    actorId: string,
    tenantId?: string | null,
  ) {
    return this.prisma.leadGroup.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#3b82f6',
        createdById: actorId,
        tenantId: tenantId ?? null,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async findAll(tenantId?: string | null) {
    return this.prisma.leadGroup.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async findById(id: string, tenantId?: string | null) {
    return this.prisma.leadGroup.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        members: {
          include: {
            lead: true,
          },
          orderBy: { assignedAt: 'desc' },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdateLeadGroupDto,
    _tenantId?: string | null,
  ) {
    return this.prisma.leadGroup.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async delete(id: string, _tenantId?: string | null) {
    return this.prisma.leadGroup.delete({
      where: { id },
    });
  }

  async addMembers(groupId: string, leadIds: string[]) {
    const creates = leadIds.map((leadId) =>
      this.prisma.leadGroupMember.upsert({
        where: {
          leadGroupId_leadId: {
            leadGroupId: groupId,
            leadId,
          },
        },
        create: {
          leadGroupId: groupId,
          leadId,
        },
        update: {},
      }),
    );
    return this.prisma.$transaction(creates);
  }

  async removeMember(groupId: string, leadId: string) {
    return this.prisma.leadGroupMember.delete({
      where: {
        leadGroupId_leadId: {
          leadGroupId: groupId,
          leadId,
        },
      },
    });
  }
}
