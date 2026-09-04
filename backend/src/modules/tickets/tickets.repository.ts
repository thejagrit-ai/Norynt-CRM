// src/modules/tickets/tickets.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma, Ticket, TicketMessage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const row = await this.prisma.ticketCounter.upsert({
      where: { year },
      create: { year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    return `TCK-${year}-${String(row.lastNumber).padStart(4, '0')}`;
  }

  async create(data: Prisma.TicketCreateInput): Promise<Ticket> {
    return this.prisma.ticket.create({
      data,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async list(
    where: Prisma.TicketWhereInput,
    skip = 0,
    take = 50,
  ): Promise<{ items: Ticket[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async update(id: string, data: Prisma.TicketUpdateInput): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async addMessage(
    data: Prisma.TicketMessageCreateInput,
  ): Promise<TicketMessage> {
    return this.prisma.ticketMessage.create({ data });
  }

  async delete(id: string): Promise<Ticket> {
    return this.prisma.ticket.delete({ where: { id } });
  }
}
