// src/modules/deals/deals.repository.ts
// VERİ ERİŞİMİ: Prisma çağrıları YALNIZCA burada. Move tek transaction (atomiklik).
import { Injectable } from '@nestjs/common';
import { DealStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getStage(id: string) {
    return this.prisma.stage.findUnique({ where: { id } });
  }

  getPipeline(id: string) {
    return this.prisma.pipeline.findUnique({ where: { id } });
  }

  userExists(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true } });
  }

  // Silinmemiş deal.
  getDeal(id: string) {
    return this.prisma.deal.findFirst({
      where: { id, deletedAt: null },
      include: { stage: true, owner: { select: { id: true } } },
    });
  }

  async maxRankInStage(stageId: string): Promise<number | null> {
    const res = await this.prisma.deal.aggregate({
      where: { stageId, deletedAt: null },
      _max: { rank: true },
    });
    return res._max.rank ? Number(res._max.rank) : null;
  }

  create(data: Prisma.DealCreateInput) {
    return this.prisma.deal.create({
      data,
      include: { stage: true, owner: { select: { id: true } } },
    });
  }

  update(id: string, data: Prisma.DealUpdateInput) {
    return this.prisma.deal.update({
      where: { id },
      data,
      include: { stage: true, owner: { select: { id: true } } },
    });
  }

  softDelete(id: string) {
    return this.prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  setOwner(id: string, ownerId: string | null) {
    return this.prisma.deal.update({
      where: { id },
      data: { ownerId },
      include: { stage: true, owner: { select: { id: true } } },
    });
  }

  // Aşama+sıra değişimi + aktivite kaydı TEK transaction'da.
  async applyMove(params: {
    id: string;
    toStageId: string;
    rank: number;
    status: DealStatus;
    fromStageId: string;
    userId: string;
  }) {
    const [deal] = await this.prisma.$transaction([
      this.prisma.deal.update({
        where: { id: params.id },
        data: {
          stageId: params.toStageId,
          rank: params.rank,
          status: params.status,
        },
        include: { stage: true, owner: { select: { id: true } } },
      }),
      this.prisma.dealActivity.create({
        data: {
          dealId: params.id,
          userId: params.userId,
          type: 'STAGE_CHANGE',
          payload: { from: params.fromStageId, to: params.toStageId },
        },
      }),
    ]);
    return deal;
  }

  board(pipelineId: string) {
    return this.prisma.stage.findMany({
      where: { pipelineId },
      orderBy: { position: 'asc' },
      include: {
        deals: {
          where: { deletedAt: null },
          orderBy: { rank: 'asc' },
        },
      },
    });
  }

  async list(where: Prisma.DealWhereInput, skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: [{ stageId: 'asc' }, { rank: 'asc' }],
        include: { stage: true, owner: { select: { id: true } } },
      }),
      this.prisma.deal.count({ where }),
    ]);
    return { items, total };
  }

  addActivity(
    dealId: string,
    userId: string,
    type: string,
    payload: Prisma.InputJsonValue | undefined,
  ) {
    return this.prisma.dealActivity.create({
      data: { dealId, userId, type, payload },
    });
  }

  getActivities(dealId: string) {
    return this.prisma.dealActivity.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
