// src/modules/whatsapp/whatsapp.repository.ts
// VERİ ERİŞİMİ: Prisma çağrıları YALNIZCA burada (WhatsAppMessage + telefon eşleme).
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WhatsAppRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMessage(data: Prisma.WhatsAppMessageUncheckedCreateInput) {
    return this.prisma.whatsAppMessage.create({ data });
  }

  // Tenant scope middleware groupBy'ı kapsamaz → findMany + JS toplulaştırma (raporlarla tutarlı).
  listAll(take = 500) {
    return this.prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  thread(phone: string, take = 100) {
    return this.prisma.whatsAppMessage.findMany({
      where: { phone },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  // Telefonun son 10 hanesi ile lead/contact eşle (format farklarına dayanıklı).
  findLeadByPhoneTail(tail: string) {
    return this.prisma.lead.findFirst({
      where: { phone: { contains: tail } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findContactByPhoneTail(tail: string) {
    return this.prisma.contact.findFirst({
      where: { phone: { contains: tail } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Broadcasts ---
  createBroadcast(data: any) {
    return this.prisma.whatsAppBroadcast.create({ data });
  }

  listBroadcasts(tenantId?: string | null) {
    return this.prisma.whatsAppBroadcast.findMany({
      where: { tenantId: tenantId ?? null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findBroadcastById(id: string) {
    return this.prisma.whatsAppBroadcast.findUnique({ where: { id } });
  }

  updateBroadcast(id: string, data: any) {
    return this.prisma.whatsAppBroadcast.update({ where: { id }, data });
  }

  deleteBroadcast(id: string) {
    return this.prisma.whatsAppBroadcast.delete({ where: { id } });
  }

  // --- HSM Templates ---
  createTemplate(data: any) {
    return this.prisma.whatsAppTemplate.create({ data });
  }

  listTemplates(tenantId?: string | null) {
    return this.prisma.whatsAppTemplate.findMany({
      where: { tenantId: tenantId ?? null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findTemplateById(id: string) {
    return this.prisma.whatsAppTemplate.findUnique({ where: { id } });
  }

  updateTemplate(id: string, data: any) {
    return this.prisma.whatsAppTemplate.update({ where: { id }, data });
  }

  deleteTemplate(id: string) {
    return this.prisma.whatsAppTemplate.delete({ where: { id } });
  }

  // --- Quick Replies ---
  createQuickReply(data: any) {
    return this.prisma.quickReply.create({ data });
  }

  listQuickReplies(tenantId?: string | null) {
    return this.prisma.quickReply.findMany({
      where: { tenantId: tenantId ?? null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findQuickReplyById(id: string) {
    return this.prisma.quickReply.findUnique({ where: { id } });
  }

  updateQuickReply(id: string, data: any) {
    return this.prisma.quickReply.update({ where: { id }, data });
  }

  deleteQuickReply(id: string) {
    return this.prisma.quickReply.delete({ where: { id } });
  }

  // --- Audience Resolution ---
  countLeads(tenantId?: string | null) {
    return this.prisma.lead.count({
      where: { tenantId: tenantId ?? null },
    });
  }

  countContacts(tenantId?: string | null) {
    return this.prisma.contact.count({
      where: { tenantId: tenantId ?? null },
    });
  }

  getLeadPhones(tenantId?: string | null, limit = 1000) {
    return this.prisma.lead.findMany({
      where: {
        phone: { not: null },
        tenantId: tenantId ?? null,
      },
      select: { id: true, firstName: true, lastName: true, phone: true },
      take: limit,
    });
  }

  getContactPhones(tenantId?: string | null, limit = 1000) {
    return this.prisma.contact.findMany({
      where: {
        phone: { not: null },
        tenantId: tenantId ?? null,
      },
      select: { id: true, firstName: true, lastName: true, phone: true },
      take: limit,
    });
  }

  // --- WhatsApp Workflows (backed by AutomationRule with WHATSAPP_ triggers) ---
  listWorkflows(tenantId?: string | null) {
    return this.prisma.automationRule.findMany({
      where: {
        trigger: { startsWith: 'WHATSAPP_' },
        tenantId: tenantId ?? null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findWorkflowById(id: string) {
    return this.prisma.automationRule.findUnique({ where: { id } });
  }

  createWorkflow(data: Prisma.AutomationRuleCreateInput) {
    return this.prisma.automationRule.create({ data });
  }

  updateWorkflow(id: string, data: Prisma.AutomationRuleUpdateInput) {
    return this.prisma.automationRule.update({ where: { id }, data });
  }

  deleteWorkflow(id: string) {
    return this.prisma.automationRule.delete({ where: { id } });
  }

  findActiveWorkflowsByTrigger(trigger: string, tenantId?: string | null) {
    return this.prisma.automationRule.findMany({
      where: {
        trigger,
        isActive: true,
        tenantId: tenantId ?? null,
      },
    });
  }
}
