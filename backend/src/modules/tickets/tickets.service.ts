// src/modules/tickets/tickets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TicketsRepository } from './tickets.repository';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  QueryTicketDto,
  UpdateTicketDto,
} from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly repo: TicketsRepository) {}

  async create(dto: CreateTicketDto, actor: AuthenticatedUser) {
    const number = await this.repo.nextNumber();
    const data: Prisma.TicketCreateInput = {
      number,
      subject: dto.subject,
      description: dto.description,
      priority: dto.priority,
      status: TicketStatus.OPEN,
      tenantId: actor.tenantId,
    };

    if (dto.assignedToId) {
      data.assignedTo = { connect: { id: dto.assignedToId } };
    }
    if (dto.contactId) {
      data.contact = { connect: { id: dto.contactId } };
    }
    if (dto.companyId) {
      data.company = { connect: { id: dto.companyId } };
    }
    if (dto.dealId) {
      data.deal = { connect: { id: dto.dealId } };
    }

    return this.repo.create(data);
  }

  async findAll(q: QueryTicketDto, actor: AuthenticatedUser) {
    const where: Prisma.TicketWhereInput = {};
    if (actor.tenantId) where.tenantId = actor.tenantId;
    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority;
    if (q.assignedToId) where.assignedToId = q.assignedToId;
    if (q.contactId) where.contactId = q.contactId;
    if (q.companyId) where.companyId = q.companyId;
    if (q.q) {
      where.OR = [
        { subject: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
        { number: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.repo.list(where, q.skip, q.limit);
    return { data: items, meta: { page: q.page, limit: q.limit, total } };
  }

  async findOne(id: string) {
    const ticket = await this.repo.findById(id);
    if (!ticket) throw new NotFoundException('Destek talebi bulunamadı');
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.findOne(id);
    const data: Prisma.TicketUpdateInput = {};
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId
        ? { connect: { id: dto.assignedToId } }
        : { disconnect: true };
    }

    return this.repo.update(id, data);
  }

  async addMessage(
    ticketId: string,
    dto: CreateTicketMessageDto,
    actor: AuthenticatedUser,
  ) {
    await this.findOne(ticketId);
    return this.repo.addMessage({
      ticket: { connect: { id: ticketId } },
      body: dto.body,
      isInternal: dto.isInternal ?? false,
      senderType: 'AGENT',
      senderId: actor.id,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
