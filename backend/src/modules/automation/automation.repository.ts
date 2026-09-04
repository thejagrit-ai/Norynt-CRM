// src/modules/automation/automation.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AutomationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AutomationRuleCreateInput) {
    return this.prisma.automationRule.create({ data });
  }

  findById(id: string) {
    return this.prisma.automationRule.findFirst({ where: { id } });
  }

  async list(
    where: Prisma.AutomationRuleWhereInput,
    skip: number,
    take: number,
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.automationRule.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.automationRule.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: Prisma.AutomationRuleUpdateInput) {
    return this.prisma.automationRule.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.automationRule.delete({ where: { id } });
  }

  findActiveByTrigger(trigger: string) {
    return this.prisma.automationRule.findMany({
      where: { trigger, isActive: true },
    });
  }

  createDealActivity(dealId: string, userId: string, note: string) {
    return this.prisma.dealActivity.create({
      data: { dealId, userId, type: 'AUTOMATION', payload: { note } },
    });
  }
}
