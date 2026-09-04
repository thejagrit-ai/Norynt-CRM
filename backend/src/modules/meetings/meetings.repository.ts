// src/modules/meetings/meetings.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MeetingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MeetingCreateInput) {
    return this.prisma.meeting.create({ data });
  }

  findById(id: string) {
    return this.prisma.meeting.findFirst({ where: { id } });
  }

  async list(where: Prisma.MeetingWhereInput, skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.meeting.findMany({
        where,
        skip,
        take,
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.meeting.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: Prisma.MeetingUpdateInput) {
    return this.prisma.meeting.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.meeting.delete({ where: { id } });
  }
}
