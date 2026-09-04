// src/modules/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto, QueryTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly repo: TasksRepository) {}

  async create(dto: CreateTaskDto, actor: AuthenticatedUser) {
    const data: Prisma.TaskCreateInput = {
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.TODO,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      tags: dto.tags ?? [],
      createdBy: { connect: { id: actor.id } },
      tenantId: actor.tenantId,
    };

    if (dto.assignedToId) {
      data.assignedTo = { connect: { id: dto.assignedToId } };
    }
    if (dto.leadId) {
      data.lead = { connect: { id: dto.leadId } };
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

  async findAll(q: QueryTaskDto, actor: AuthenticatedUser) {
    const where: Prisma.TaskWhereInput = {};
    if (actor.tenantId) where.tenantId = actor.tenantId;
    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority;
    if (q.assignedToId) where.assignedToId = q.assignedToId;
    if (q.dealId) where.dealId = q.dealId;
    if (q.contactId) where.contactId = q.contactId;
    if (q.companyId) where.companyId = q.companyId;
    if (q.leadId) where.leadId = q.leadId;
    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.repo.list(where, q.skip, q.limit);
    return { data: items, meta: { page: q.page, limit: q.limit, total } };
  }

  async findOne(id: string) {
    const task = await this.repo.findById(id);
    if (!task) throw new NotFoundException('Görev bulunamadı');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === TaskStatus.DONE) {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId
        ? { connect: { id: dto.assignedToId } }
        : { disconnect: true };
    }

    return this.repo.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
