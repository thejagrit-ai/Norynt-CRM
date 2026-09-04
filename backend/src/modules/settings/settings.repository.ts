// src/modules/settings/settings.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAssignmentRuleDto,
  CreateLeadMasterDto,
  CreateSlaPolicyDto,
  UpdateChatbotConfigDto,
  UpdateSubscriptionDto,
} from './dto/settings.dto';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Subscription ---
  async getSubscription(tenantId?: string | null) {
    let sub = await this.prisma.tenantSubscription.findFirst({
      where: tenantId ? { tenantId } : undefined,
    });
    if (!sub) {
      sub = await this.prisma.tenantSubscription.create({
        data: {
          tenantId: tenantId ?? null,
          planTier: 'ENTERPRISE',
          status: 'ACTIVE',
          seatLimit: 50,
          usedSeats: 8,
          emailMonthlyLimit: 50000,
          usedEmails: 12450,
          storageLimitMb: 100000,
          usedStorageMb: 4820,
          apiMonthlyLimit: 1000000,
          usedApiRequests: 142000,
        },
      });
    }
    return sub;
  }

  async updateSubscription(dto: UpdateSubscriptionDto, tenantId?: string | null) {
    const sub = await this.getSubscription(tenantId);
    let seatLimit = 10;
    let emailMonthlyLimit = 10000;
    let storageLimitMb = 20000;

    if (dto.planTier === 'ENTERPRISE') {
      seatLimit = 50;
      emailMonthlyLimit = 50000;
      storageLimitMb = 100000;
    } else if (dto.planTier === 'PRO') {
      seatLimit = 25;
      emailMonthlyLimit = 25000;
      storageLimitMb = 50000;
    }

    return this.prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: {
        planTier: dto.planTier,
        billingCycle: dto.billingCycle || sub.billingCycle,
        seatLimit,
        emailMonthlyLimit,
        storageLimitMb,
      },
    });
  }

  // --- SLA Policies ---
  async getSlaPolicies(tenantId?: string | null) {
    let policies = await this.prisma.ticketSlaPolicy.findMany({
      where: tenantId ? { tenantId } : undefined,
    });
    if (policies.length === 0) {
      const defaults = [
        { priority: 'URGENT', responseTimeHours: 1, resolutionTimeHours: 4, autoEscalate: true },
        { priority: 'HIGH', responseTimeHours: 4, resolutionTimeHours: 12, autoEscalate: true },
        { priority: 'MEDIUM', responseTimeHours: 24, resolutionTimeHours: 48, autoEscalate: false },
        { priority: 'LOW', responseTimeHours: 48, resolutionTimeHours: 96, autoEscalate: false },
      ];
      policies = await Promise.all(
        defaults.map((d) =>
          this.prisma.ticketSlaPolicy.create({
            data: { ...d, tenantId: tenantId ?? null },
          }),
        ),
      );
    }
    return policies;
  }

  async upsertSlaPolicy(dto: CreateSlaPolicyDto, tenantId?: string | null) {
    return this.prisma.ticketSlaPolicy.upsert({
      where: { priority: dto.priority },
      create: {
        priority: dto.priority,
        responseTimeHours: dto.responseTimeHours,
        resolutionTimeHours: dto.resolutionTimeHours,
        autoEscalate: dto.autoEscalate ?? true,
        tenantId: tenantId ?? null,
      },
      update: {
        responseTimeHours: dto.responseTimeHours,
        resolutionTimeHours: dto.resolutionTimeHours,
        autoEscalate: dto.autoEscalate,
      },
    });
  }

  // --- Lead Masters ---
  async getLeadMasters(category?: string, tenantId?: string | null) {
    let list = await this.prisma.leadMasterOption.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    if (list.length === 0) {
      const defaults = [
        // Loss Reasons
        { category: 'LOSS_REASON', key: 'budget_constraints', label: 'Budget Constraints / Pricing', color: '#ef4444' },
        { category: 'LOSS_REASON', key: 'competitor_chosen', label: 'Competitor Selected', color: '#f97316' },
        { category: 'LOSS_REASON', key: 'unresponsive', label: 'No Response / Ghosted', color: '#64748b' },
        { category: 'LOSS_REASON', key: 'missing_feature', label: 'Missing Required Feature', color: '#a855f7' },
        { category: 'LOSS_REASON', key: 'timeline_postponed', label: 'Project Postponed', color: '#eab308' },
        // Rating
        { category: 'RATING', key: 'hot', label: '🔥 Hot (High Intent)', color: '#ef4444' },
        { category: 'RATING', key: 'warm', label: '⚡ Warm (Evaluating)', color: '#f59e0b' },
        { category: 'RATING', key: 'cold', label: '❄️ Cold (Nurture)', color: '#3b82f6' },
      ];
      list = await Promise.all(
        defaults.map((d) =>
          this.prisma.leadMasterOption.create({
            data: { ...d, tenantId: tenantId ?? null },
          }),
        ),
      );
    }
    return list;
  }

  async createLeadMaster(dto: CreateLeadMasterDto, tenantId?: string | null) {
    return this.prisma.leadMasterOption.create({
      data: {
        category: dto.category,
        key: dto.key,
        label: dto.label,
        color: dto.color || '#64748b',
        isDefault: dto.isDefault ?? false,
        tenantId: tenantId ?? null,
      },
    });
  }

  async deleteLeadMaster(id: string) {
    return this.prisma.leadMasterOption.delete({ where: { id } });
  }

  // --- Auto-Assignment Rules ---
  async getAssignmentRules(type?: string, tenantId?: string | null) {
    let rules = await this.prisma.assignmentRule.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (rules.length === 0) {
      const sample = await this.prisma.assignmentRule.create({
        data: {
          type: 'LEAD',
          name: 'General Inbound Round-Robin Queue',
          strategy: 'ROUND_ROBIN',
          conditions: [{ field: 'channel', operator: 'equals', value: 'FORM' }],
          assignedUserIds: ['sales-team-pool'],
          isActive: true,
          tenantId: tenantId ?? null,
        },
      });
      rules = [sample];
    }
    return rules;
  }

  async createAssignmentRule(dto: CreateAssignmentRuleDto, actorId: string, tenantId?: string | null) {
    return this.prisma.assignmentRule.create({
      data: {
        type: dto.type,
        name: dto.name,
        strategy: dto.strategy || 'ROUND_ROBIN',
        conditions: dto.conditions ?? [],
        assignedUserIds: dto.assignedUserIds ?? [],
        isActive: dto.isActive ?? true,
        createdById: actorId,
        tenantId: tenantId ?? null,
      },
    });
  }

  async updateAssignmentRule(id: string, data: any) {
    return this.prisma.assignmentRule.update({ where: { id }, data });
  }

  async deleteAssignmentRule(id: string) {
    return this.prisma.assignmentRule.delete({ where: { id } });
  }

  // --- Chatbot Config ---
  async getChatbotConfig(tenantId?: string | null) {
    let cfg = await this.prisma.chatbotConfig.findFirst({
      where: tenantId ? { tenantId } : undefined,
    });
    if (!cfg) {
      cfg = await this.prisma.chatbotConfig.create({
        data: {
          tenantId: tenantId ?? null,
          botName: 'Norynt Sales Assistant',
          welcomeMessage: 'Hello! 👋 How can I help you explore our CRM solutions today?',
          promptInstructions:
            'You are an AI sales rep for Norynt CRM. Assist visitors by answering questions regarding our CRM pricing, features, integrations, and helping them book a live product demo.',
          primaryColor: '#4f46e5',
          position: 'bottom-right',
          isActive: true,
        },
      });
    }
    return cfg;
  }

  async updateChatbotConfig(dto: UpdateChatbotConfigDto, tenantId?: string | null) {
    const cfg = await this.getChatbotConfig(tenantId);
    return this.prisma.chatbotConfig.update({
      where: { id: cfg.id },
      data: dto,
    });
  }
}
