// src/modules/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import {
  CreateAssignmentRuleDto,
  CreateLeadMasterDto,
  CreateSlaPolicyDto,
  UpdateChatbotConfigDto,
  UpdateSubscriptionDto,
} from './dto/settings.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  // Overview
  async getOverview(actor: AuthenticatedUser) {
    const [sub, sla, masters, leadRules, chatbot] = await Promise.all([
      this.repo.getSubscription(actor.tenantId),
      this.repo.getSlaPolicies(actor.tenantId),
      this.repo.getLeadMasters(undefined, actor.tenantId),
      this.repo.getAssignmentRules('LEAD', actor.tenantId),
      this.repo.getChatbotConfig(actor.tenantId),
    ]);

    return {
      companyName: 'Norynt Enterprise CRM',
      baseCurrency: 'USD ($)',
      timezone: 'UTC (Server standard)',
      subscription: sub,
      slaPoliciesCount: sla.length,
      leadMastersCount: masters.length,
      activeAssignmentRules: leadRules.filter((r) => r.isActive).length,
      chatbotStatus: chatbot.isActive ? 'Active' : 'Inactive',
    };
  }

  // Subscription
  async getSubscription(actor: AuthenticatedUser) {
    return this.repo.getSubscription(actor.tenantId);
  }

  async updateSubscription(dto: UpdateSubscriptionDto, actor: AuthenticatedUser) {
    return this.repo.updateSubscription(dto, actor.tenantId);
  }

  // SLA
  async getSlaPolicies(actor: AuthenticatedUser) {
    return this.repo.getSlaPolicies(actor.tenantId);
  }

  async upsertSlaPolicy(dto: CreateSlaPolicyDto, actor: AuthenticatedUser) {
    return this.repo.upsertSlaPolicy(dto, actor.tenantId);
  }

  // Lead Masters
  async getLeadMasters(category: string | undefined, actor: AuthenticatedUser) {
    return this.repo.getLeadMasters(category, actor.tenantId);
  }

  async createLeadMaster(dto: CreateLeadMasterDto, actor: AuthenticatedUser) {
    return this.repo.createLeadMaster(dto, actor.tenantId);
  }

  async deleteLeadMaster(id: string) {
    return this.repo.deleteLeadMaster(id);
  }

  // Assignment Rules
  async getAssignmentRules(type: string | undefined, actor: AuthenticatedUser) {
    return this.repo.getAssignmentRules(type, actor.tenantId);
  }

  async createAssignmentRule(dto: CreateAssignmentRuleDto, actor: AuthenticatedUser) {
    return this.repo.createAssignmentRule(dto, actor.id, actor.tenantId);
  }

  async updateAssignmentRule(id: string, data: any) {
    return this.repo.updateAssignmentRule(id, data);
  }

  async deleteAssignmentRule(id: string) {
    return this.repo.deleteAssignmentRule(id);
  }

  // Chatbot
  async getChatbotConfig(actor: AuthenticatedUser) {
    return this.repo.getChatbotConfig(actor.tenantId);
  }

  async updateChatbotConfig(dto: UpdateChatbotConfigDto, actor: AuthenticatedUser) {
    return this.repo.updateChatbotConfig(dto, actor.tenantId);
  }
}
