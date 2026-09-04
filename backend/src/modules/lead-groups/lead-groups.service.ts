// src/modules/lead-groups/lead-groups.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadGroupsRepository } from './lead-groups.repository';
import { CreateLeadGroupDto, UpdateLeadGroupDto } from './dto/lead-group.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class LeadGroupsService {
  constructor(private readonly repo: LeadGroupsRepository) {}

  async create(dto: CreateLeadGroupDto, actor: AuthenticatedUser) {
    return this.repo.create(dto, actor.id, actor.tenantId);
  }

  async findAll(actor: AuthenticatedUser) {
    return this.repo.findAll(actor.tenantId);
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const group = await this.repo.findById(id, actor.tenantId);
    if (!group) throw new NotFoundException(`Lead Group ${id} not found`);
    return group;
  }

  async update(id: string, dto: UpdateLeadGroupDto, actor: AuthenticatedUser) {
    await this.findOne(id, actor);
    return this.repo.update(id, dto, actor.tenantId);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    await this.findOne(id, actor);
    return this.repo.delete(id, actor.tenantId);
  }

  async addMembers(id: string, leadIds: string[], actor: AuthenticatedUser) {
    await this.findOne(id, actor);
    return this.repo.addMembers(id, leadIds);
  }

  async removeMember(id: string, leadId: string, actor: AuthenticatedUser) {
    await this.findOne(id, actor);
    return this.repo.removeMember(id, leadId);
  }
}
