// src/modules/media/media.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMediaFileDto } from './dto/media.dto';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateMediaFileDto,
    actorId: string,
    tenantId?: string | null,
  ) {
    return this.prisma.mediaFile.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        folder: data.folder || 'general',
        tags: data.tags ?? [],
        uploadedById: actorId,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAll(folder?: string, tenantId?: string | null) {
    return this.prisma.mediaFile.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(folder ? { folder } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.mediaFile.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return this.prisma.mediaFile.delete({ where: { id } });
  }
}
