// src/modules/segments/segments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { SegmentsRepository } from './segments.repository';
import { CreateSegmentDto, UpdateSegmentDto } from './dto/segment.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SegmentsService {
  constructor(private readonly repo: SegmentsRepository) {}

  async create(dto: CreateSegmentDto, actor: AuthenticatedUser) {
    return this.repo.create(dto, actor.id, actor.tenantId);
  }

  async findAll(actor: AuthenticatedUser) {
    const segments = await this.repo.findAll(actor.tenantId);
    // Enrich with contact count estimate
    const enriched = await Promise.all(
      segments.map(async (seg) => {
        const count = await this.repo.calculateMatchingContacts(
          Array.isArray(seg.filterRules) ? seg.filterRules : [],
          actor.tenantId,
        );
        return {
          ...seg,
          matchedContactsCount: count,
        };
      }),
    );
    return enriched;
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const seg = await this.repo.findById(id, actor.tenantId);
    if (!seg) throw new NotFoundException(`Segment ${id} not found`);
    const count = await this.repo.calculateMatchingContacts(
      Array.isArray(seg.filterRules) ? seg.filterRules : [],
      actor.tenantId,
    );
    return {
      ...seg,
      matchedContactsCount: count,
    };
  }

  async update(id: string, dto: UpdateSegmentDto, actor: AuthenticatedUser) {
    await this.findOne(id, actor);
    return this.repo.update(id, dto);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    await this.findOne(id, actor);
    return this.repo.delete(id);
  }
}
