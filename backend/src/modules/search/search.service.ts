// src/modules/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const TAKE = 8;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, actor: AuthenticatedUser) {
    const term = q.trim();
    if (!term) {
      return {
        query: term,
        deals: [],
        contacts: [],
        companies: [],
        tasks: [],
        tickets: [],
        leads: [],
        invoices: [],
        quotes: [],
        products: [],
        meetings: [],
        brands: [],
        competitors: [],
        users: [],
      };
    }

    const can = (p: string) => actor.permissions.includes(p);
    const tenantId = actor.tenantId ?? undefined;

    const [
      deals,
      contacts,
      companies,
      tasks,
      tickets,
      leads,
      invoices,
      quotes,
      products,
      meetings,
      brands,
      competitors,
      users,
    ] =
      await Promise.all([
        can(PERMISSIONS.DEAL.READ)
          ? this.deals(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.CONTACT.READ)
          ? this.contacts(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.COMPANY.READ)
          ? this.companies(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.TASK.READ)
          ? this.tasks(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.TICKET.READ)
          ? this.tickets(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.LEAD.READ)
          ? this.leads(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.INVOICE.READ)
          ? this.invoices(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.QUOTE.READ)
          ? this.quotes(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.PRODUCT.READ)
          ? this.products(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.MEETING.READ)
          ? this.meetings(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.BRAND.READ)
          ? this.brands(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.BRAND.READ)
          ? this.competitors(term, tenantId)
          : Promise.resolve([]),
        can(PERMISSIONS.USER.READ)
          ? this.users(term, tenantId)
          : Promise.resolve([]),
      ]);

    return {
      query: term,
      deals,
      contacts,
      companies,
      tasks,
      tickets,
      leads,
      invoices,
      quotes,
      products,
      meetings,
      brands,
      competitors,
      users,
    };
  }

  private async deals(q: string, tenantId?: string) {
    return this.prisma.deal.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        value: true,
        currency: true,
      },
    });
  }

  private async contacts(q: string, tenantId?: string) {
    return this.prisma.contact.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });
  }

  private async companies(q: string, tenantId?: string) {
    return this.prisma.company.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { domain: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, name: true, domain: true },
    });
  }

  private async tasks(q: string, tenantId?: string) {
    return this.prisma.task.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    });
  }

  private async tickets(q: string, tenantId?: string) {
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        OR: [
          { number: { contains: q, mode: 'insensitive' } },
          { subject: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        priority: true,
      },
    });
  }

  private async leads(q: string, tenantId?: string) {
    return this.prisma.lead.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { companyName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        status: true,
      },
    });
  }

  private async invoices(q: string, tenantId?: string) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        OR: [
          { number: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
          { customerEmail: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, number: true, customerName: true, status: true },
    });
  }

  private async quotes(q: string, tenantId?: string) {
    return this.prisma.quote.findMany({
      where: {
        tenantId,
        OR: [
          { number: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
          { customerEmail: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, number: true, customerName: true, status: true },
    });
  }

  private async products(q: string, tenantId?: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, name: true, sku: true, active: true },
    });
  }

  private async meetings(q: string, tenantId?: string) {
    return this.prisma.meeting.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, title: true, startsAt: true, location: true },
    });
  }

  private async brands(q: string, tenantId?: string) {
    return this.prisma.brand.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sector: { contains: q, mode: 'insensitive' } },
          { niche: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, name: true, sector: true, niche: true },
    });
  }

  private async competitors(q: string, tenantId?: string) {
    return this.prisma.competitor.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { domain: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, name: true, domain: true },
    });
  }

  private async users(q: string, tenantId?: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: TAKE,
      select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
    });
  }
}
