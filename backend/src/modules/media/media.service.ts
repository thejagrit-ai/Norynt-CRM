// src/modules/media/media.service.ts
import { Injectable } from '@nestjs/common';
import { MediaRepository } from './media.repository';
import { CreateMediaFileDto } from './dto/media.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MediaService {
  constructor(private readonly repo: MediaRepository) {}

  async findAll(folder: string | undefined, actor: AuthenticatedUser) {
    let list = await this.repo.findAll(folder, actor.tenantId);
    if (list.length === 0) {
      const samples = [
        {
          filename: 'norynt_brand_identity_guide.pdf',
          originalName: 'Norynt Brand Guidelines 2026.pdf',
          mimeType: 'application/pdf',
          size: 4280000,
          url: 'https://assets.norynt.com/docs/brand-guide.pdf',
          folder: 'documents',
          tags: ['branding', 'marketing', 'guide'],
        },
        {
          filename: 'enterprise_quote_hero_banner.png',
          originalName: 'Product Banner 1920x1080.png',
          mimeType: 'image/png',
          size: 1840000,
          url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
          folder: 'images',
          tags: ['marketing', 'banner', 'hero'],
        },
        {
          filename: 'standard_service_agreement_v2.docx',
          originalName: 'Service Agreement Template.docx',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 850000,
          url: 'https://assets.norynt.com/templates/agreement.docx',
          folder: 'templates',
          tags: ['legal', 'quotes'],
        },
      ];
      list = await Promise.all(
        samples.map((s) => this.repo.create(s, actor.id, actor.tenantId)),
      );
    }
    return list;
  }

  async create(dto: CreateMediaFileDto, actor: AuthenticatedUser) {
    return this.repo.create(dto, actor.id, actor.tenantId);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
