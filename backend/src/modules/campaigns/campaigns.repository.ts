// src/modules/campaigns/campaigns.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEmailCampaignDto,
  CreateFunnelDto,
  CreateSmsCampaignDto,
  CreateTemplateDto,
  CreateWarmupProfileDto,
  UpdateEmailCampaignDto,
  UpdateTemplateDto,
} from './dto/campaigns.dto';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class CampaignsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Email Campaigns ---
  async createEmail(data: CreateEmailCampaignDto, actorId: string, tenantId?: string | null) {
    return this.prisma.emailCampaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        previewText: data.previewText,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        templateId: data.templateId,
        segmentId: data.segmentId,
        content: data.content,
        status: data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: actorId,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAllEmails(tenantId?: string | null) {
    return this.prisma.emailCampaign.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findEmailById(id: string, tenantId?: string | null) {
    return this.prisma.emailCampaign.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });
  }

  async updateEmail(id: string, data: UpdateEmailCampaignDto) {
    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.previewText !== undefined && { previewText: data.previewText }),
        ...(data.fromName !== undefined && { fromName: data.fromName }),
        ...(data.fromEmail !== undefined && { fromEmail: data.fromEmail }),
        ...(data.templateId !== undefined && { templateId: data.templateId }),
        ...(data.segmentId !== undefined && { segmentId: data.segmentId }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          status: data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        }),
      },
    });
  }

  async sendEmailCampaign(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new Error('Campaign not found');

    const leadCount = await this.prisma.lead.count({
      where: campaign.tenantId ? { tenantId: campaign.tenantId } : undefined,
    });
    const recipientCount = leadCount > 0 ? leadCount : 1;

    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.SENT,
        sentAt: new Date(),
        sentCount: recipientCount,
        openCount: 0,
        clickCount: 0,
        totalRecipients: recipientCount,
      },
    });
  }

  async deleteEmail(id: string) {
    return this.prisma.emailCampaign.delete({ where: { id } });
  }

  // --- SMS Campaigns ---
  async createSms(data: CreateSmsCampaignDto, actorId: string, tenantId?: string | null) {
    return this.prisma.smsCampaign.create({
      data: {
        name: data.name,
        senderId: data.senderId,
        message: data.message,
        segmentId: data.segmentId,
        status: data.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: actorId,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAllSms(tenantId?: string | null) {
    return this.prisma.smsCampaign.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendSmsCampaign(id: string) {
    const campaign = await this.prisma.smsCampaign.findUnique({ where: { id } });
    if (!campaign) throw new Error('Campaign not found');

    const leadCount = await this.prisma.lead.count({
      where: campaign.tenantId ? { tenantId: campaign.tenantId } : undefined,
    });
    const recipientCount = leadCount > 0 ? leadCount : 1;

    return this.prisma.smsCampaign.update({
      where: { id },
      data: {
        status: CampaignStatus.SENT,
        sentAt: new Date(),
        sentCount: recipientCount,
        deliveredCount: recipientCount,
        totalRecipients: recipientCount,
      },
    });
  }

  async deleteSms(id: string) {
    return this.prisma.smsCampaign.delete({ where: { id } });
  }

  // --- Templates ---
  async createTemplate(data: CreateTemplateDto, actorId: string, tenantId?: string | null) {
    return this.prisma.messageTemplate.create({
      data: {
        name: data.name,
        channel: data.channel ?? 'EMAIL',
        category: data.category ?? 'marketing',
        subject: data.subject,
        content: data.content,
        variables: data.variables ?? [],
        createdById: actorId,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAllTemplates(tenantId?: string | null) {
    return this.prisma.messageTemplate.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTemplate(id: string, data: UpdateTemplateDto) {
    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.variables !== undefined && { variables: data.variables }),
      },
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.messageTemplate.delete({ where: { id } });
  }

  // --- Email Warmup ---
  async getWarmupProfiles(tenantId?: string | null) {
    return this.prisma.emailWarmupProfile.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWarmupProfile(data: CreateWarmupProfileDto, tenantId?: string | null) {
    return this.prisma.emailWarmupProfile.create({
      data: {
        emailAddress: data.emailAddress,
        provider: data.provider || 'Google Workspace',
        dailyLimit: data.dailyLimit || 50,
        tenantId: tenantId ?? null,
      },
    });
  }

  async toggleWarmupStatus(id: string, status: string) {
    return this.prisma.emailWarmupProfile.update({
      where: { id },
      data: { status },
    });
  }

  // --- Funnels ---
  async findAllFunnels(tenantId?: string | null) {
    return this.prisma.marketingFunnel.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFunnel(data: CreateFunnelDto, actorId: string, tenantId?: string | null) {
    let stagesToCreate = data.stages;

    if (!stagesToCreate || stagesToCreate.length === 0) {
      const totalLeads = await this.prisma.lead.count({
        where: tenantId ? { tenantId } : undefined,
      });
      const qualifiedLeads = await this.prisma.lead.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: { not: 'NEW' },
        },
      });
      const totalDeals = await this.prisma.deal.count({
        where: tenantId ? { tenantId } : undefined,
      });
      const wonDeals = await this.prisma.deal.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: 'WON',
        },
      });

      stagesToCreate = [
        {
          name: 'Total Inbound Leads',
          order: 0,
          visitors: totalLeads > 0 ? totalLeads : 0,
          conversions: qualifiedLeads > 0 ? qualifiedLeads : 0,
        },
        {
          name: 'Qualified Leads (MQL)',
          order: 1,
          visitors: qualifiedLeads > 0 ? qualifiedLeads : 0,
          conversions: totalDeals > 0 ? totalDeals : 0,
        },
        {
          name: 'Opportunity Pipeline (Deals)',
          order: 2,
          visitors: totalDeals > 0 ? totalDeals : 0,
          conversions: wonDeals > 0 ? wonDeals : 0,
        },
        {
          name: 'Deals Won (Revenue Converted)',
          order: 3,
          visitors: wonDeals > 0 ? wonDeals : 0,
          conversions: wonDeals > 0 ? wonDeals : 0,
        },
      ];
    }

    return this.prisma.marketingFunnel.create({
      data: {
        name: data.name,
        description: data.description,
        createdById: actorId,
        tenantId: tenantId ?? null,
        stages: {
          create: stagesToCreate.map((s, idx) => ({
            name: s.name,
            order: s.order ?? idx,
            visitors: s.visitors ?? 0,
            conversions: s.conversions ?? 0,
            dropoffRate: s.visitors && s.visitors > 0 ? Number(((1 - (s.conversions ?? 0) / s.visitors) * 100).toFixed(1)) : 0,
          })),
        },
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deleteFunnel(id: string) {
    return this.prisma.marketingFunnel.delete({ where: { id } });
  }
}
