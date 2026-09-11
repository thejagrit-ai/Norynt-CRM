// src/modules/campaigns/campaigns.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignsRepository } from './campaigns.repository';
import {
  CreateEmailCampaignDto,
  CreateFunnelDto,
  CreateSmsCampaignDto,
  CreateTemplateDto,
  CreateWarmupProfileDto,
  UpdateEmailCampaignDto,
  UpdateTemplateDto,
} from './dto/campaigns.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class CampaignsService {
  constructor(private readonly repo: CampaignsRepository) {}

  // Email
  async createEmail(dto: CreateEmailCampaignDto, actor: AuthenticatedUser) {
    return this.repo.createEmail(dto, actor.id, actor.tenantId);
  }

  async findAllEmails(actor: AuthenticatedUser) {
    return this.repo.findAllEmails(actor.tenantId);
  }

  async findEmail(id: string, actor: AuthenticatedUser) {
    const campaign = await this.repo.findEmailById(id, actor.tenantId);
    if (!campaign)
      throw new NotFoundException(`Email campaign ${id} not found`);
    return campaign;
  }

  async updateEmail(
    id: string,
    dto: UpdateEmailCampaignDto,
    actor: AuthenticatedUser,
  ) {
    await this.findEmail(id, actor);
    return this.repo.updateEmail(id, dto);
  }

  async sendEmailCampaign(id: string, actor: AuthenticatedUser) {
    await this.findEmail(id, actor);
    return this.repo.sendEmailCampaign(id);
  }

  async deleteEmail(id: string, actor: AuthenticatedUser) {
    await this.findEmail(id, actor);
    return this.repo.deleteEmail(id);
  }

  // SMS
  async createSms(dto: CreateSmsCampaignDto, actor: AuthenticatedUser) {
    return this.repo.createSms(dto, actor.id, actor.tenantId);
  }

  async findAllSms(actor: AuthenticatedUser) {
    return this.repo.findAllSms(actor.tenantId);
  }

  async sendSmsCampaign(id: string, actor: AuthenticatedUser) {
    return this.repo.sendSmsCampaign(id);
  }

  async deleteSms(id: string, actor: AuthenticatedUser) {
    return this.repo.deleteSms(id);
  }

  // Templates
  async createTemplate(dto: CreateTemplateDto, actor: AuthenticatedUser) {
    return this.repo.createTemplate(dto, actor.id, actor.tenantId);
  }

  async findAllTemplates(actor: AuthenticatedUser) {
    return this.repo.findAllTemplates(actor.tenantId);
  }

  async updateTemplate(
    id: string,
    dto: UpdateTemplateDto,
    actor: AuthenticatedUser,
  ) {
    return this.repo.updateTemplate(id, dto);
  }

  async deleteTemplate(id: string, actor: AuthenticatedUser) {
    return this.repo.deleteTemplate(id);
  }

  // Warmup
  async getWarmupProfiles(actor: AuthenticatedUser) {
    return this.repo.getWarmupProfiles(actor.tenantId);
  }

  async createWarmupProfile(
    dto: CreateWarmupProfileDto,
    actor: AuthenticatedUser,
  ) {
    return this.repo.createWarmupProfile(dto, actor.tenantId);
  }

  async toggleWarmup(id: string, status: string, actor: AuthenticatedUser) {
    return this.repo.toggleWarmupStatus(id, status);
  }

  // Funnels
  async findAllFunnels(actor: AuthenticatedUser) {
    return this.repo.findAllFunnels(actor.tenantId);
  }

  async createFunnel(dto: CreateFunnelDto, actor: AuthenticatedUser) {
    return this.repo.createFunnel(dto, actor.id, actor.tenantId);
  }

  async deleteFunnel(id: string, actor: AuthenticatedUser) {
    return this.repo.deleteFunnel(id);
  }
}
