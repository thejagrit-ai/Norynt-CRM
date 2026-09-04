// src/modules/customer360/customer360.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

export interface TimelineEvent {
  id: string;
  type:
    | 'WHATSAPP'
    | 'DEAL_ACTIVITY'
    | 'MEETING'
    | 'TASK'
    | 'INVOICE'
    | 'QUOTE'
    | 'TICKET';
  title: string;
  description?: string | null;
  timestamp: Date;
  meta?: Record<string, unknown>;
}

@Injectable()
export class Customer360Service {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomer360(id: string, actor: AuthenticatedUser) {
    const tenantId = actor.tenantId;

    // Try finding by company first, then contact.
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId: tenantId ?? undefined },
      include: {
        contacts: true,
        subsidiaries: true,
        parentCompany: true,
      },
    });

    let contact = null;
    if (!company) {
      contact = await this.prisma.contact.findFirst({
        where: { id, tenantId: tenantId ?? undefined },
        include: { company: true },
      });
      if (!contact) throw new NotFoundException('Müşteri kaydı bulunamadı');
    }

    const companyId = company ? company.id : (contact?.companyId ?? undefined);
    const contactId = contact ? contact.id : undefined;

    // Query all related entities in parallel
    const [deals, invoices, quotes, tasks, tickets, meetings, whatsapp] =
      await Promise.all([
        this.prisma.deal.findMany({
          where: {
            OR: [
              companyId ? { companyId } : {},
              contactId ? { contactId } : {},
            ],
            deletedAt: null,
          },
          include: { activities: true, stage: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.invoice.findMany({
          where: companyId
            ? { deal: { companyId } }
            : contactId
              ? { deal: { contactId } }
              : {},
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.quote.findMany({
          where: companyId
            ? { deal: { companyId } }
            : contactId
              ? { deal: { contactId } }
              : {},
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.task.findMany({
          where: {
            OR: [
              companyId ? { companyId } : {},
              contactId ? { contactId } : {},
            ],
          },
          include: {
            assignedTo: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.ticket.findMany({
          where: {
            OR: [
              companyId ? { companyId } : {},
              contactId ? { contactId } : {},
            ],
          },
          include: { messages: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.meeting.findMany({
          where: {
            OR: [contactId ? { contactId } : {}],
          },
          orderBy: { startsAt: 'desc' },
        }),
        this.prisma.whatsAppMessage.findMany({
          where: {
            OR: [contactId ? { contactId } : {}],
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Build Unified Chronological Timeline
    const timeline: TimelineEvent[] = [];

    // WhatsApp
    for (const wa of whatsapp) {
      timeline.push({
        id: wa.id,
        type: 'WHATSAPP',
        title:
          wa.direction === 'OUT'
            ? 'Giden WhatsApp Mesajı'
            : 'Gelen WhatsApp Mesajı',
        description: wa.body,
        timestamp: wa.createdAt,
        meta: { phone: wa.phone, status: wa.status },
      });
    }

    // Deal activities
    for (const deal of deals) {
      for (const act of deal.activities) {
        timeline.push({
          id: act.id,
          type: 'DEAL_ACTIVITY',
          title: `${deal.title}: ${act.type}`,
          description:
            typeof act.payload === 'object' &&
            act.payload !== null &&
            'note' in act.payload
              ? String((act.payload as Record<string, unknown>).note)
              : null,
          timestamp: act.createdAt,
          meta: { dealId: deal.id, dealTitle: deal.title },
        });
      }
    }

    // Meetings
    for (const m of meetings) {
      timeline.push({
        id: m.id,
        type: 'MEETING',
        title: `Toplantı: ${m.title}`,
        description: m.notes,
        timestamp: m.startsAt,
        meta: { location: m.location },
      });
    }

    // Tasks
    for (const t of tasks) {
      timeline.push({
        id: t.id,
        type: 'TASK',
        title: `Görev: ${t.title}`,
        description: t.description,
        timestamp: t.createdAt,
        meta: { status: t.status, priority: t.priority, dueDate: t.dueDate },
      });
    }

    // Invoices
    for (const inv of invoices) {
      timeline.push({
        id: inv.id,
        type: 'INVOICE',
        title: `Fatura ${inv.number ?? ''}: ${inv.status}`,
        description: `Tutar: ${inv.total} ${inv.currency}`,
        timestamp: inv.createdAt,
        meta: { total: inv.total, status: inv.status },
      });
    }

    // Quotes
    for (const q of quotes) {
      timeline.push({
        id: q.id,
        type: 'QUOTE',
        title: `Teklif ${q.number ?? ''}: ${q.status}`,
        description: `Tutar: ${q.total} ${q.currency}`,
        timestamp: q.createdAt,
        meta: { total: q.total, status: q.status },
      });
    }

    // Tickets
    for (const t of tickets) {
      timeline.push({
        id: t.id,
        type: 'TICKET',
        title: `Destek Talebi ${t.number}: ${t.subject}`,
        description: t.description,
        timestamp: t.createdAt,
        meta: { status: t.status, priority: t.priority },
      });
    }

    timeline.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Financial calculations
    const totalInvoiced = invoices.reduce(
      (acc: number, i) => acc + Number(i.total),
      0,
    );
    const totalPaid = invoices.reduce(
      (acc: number, i) => acc + Number(i.amountPaid),
      0,
    );
    const openDealsValue = deals
      .filter((d) => d.status === 'OPEN')
      .reduce((acc: number, d) => acc + Number(d.value ?? 0), 0);

    // AI Health Score derivation (0-100)
    let healthScore = 85;
    if (timeline.length === 0) healthScore = 40;
    if (tickets.some((t) => t.status === 'OPEN' && t.priority === 'URGENT'))
      healthScore -= 25;
    if (invoices.some((i) => i.status === 'OVERDUE')) healthScore -= 20;

    let recommendation =
      'Müşteri durumu stabil. Standart periyodik iletişim sürdürülebilir.';
    if (invoices.some((i) => i.status === 'OVERDUE')) {
      recommendation =
        'Vadesi geçmiş fatura mevcut — Muhasebe hatırlatma mesajı gönderin.';
    } else if (deals.some((d) => d.status === 'OPEN')) {
      recommendation =
        'Açık fırsat mevcut — Teklif detaylarını netleştirmek için toplantı planlayın.';
    } else if (
      timeline.length > 0 &&
      Date.now() - new Date(timeline[0].timestamp).getTime() > 14 * 86400000
    ) {
      recommendation =
        '14 gündür etkileşim yok — Müşteri memnuniyet kontrolü için arama yapın.';
    }

    return {
      identity: company
        ? { type: 'COMPANY', data: company }
        : { type: 'CONTACT', data: contact },
      revenue: {
        totalInvoiced,
        totalPaid,
        outstanding: totalInvoiced - totalPaid,
        openDealsValue,
        dealsCount: deals.length,
        quotesCount: quotes.length,
        invoicesCount: invoices.length,
      },
      intelligence: {
        healthScore: Math.max(10, Math.min(100, healthScore)),
        recommendation,
        lastActivityAt: timeline[0]?.timestamp ?? null,
      },
      deals,
      invoices,
      quotes,
      tasks,
      tickets,
      timeline: timeline.slice(0, 100),
    };
  }
}
