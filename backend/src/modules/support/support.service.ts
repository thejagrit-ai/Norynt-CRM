// src/modules/support/support.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { SupportRepository } from './support.repository';
import {
  CreateFaqCategoryDto,
  CreateKnowledgeArticleDto,
  UpdateKnowledgeArticleDto,
} from './dto/support.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class SupportService {
  constructor(private readonly repo: SupportRepository) {}

  async findAllCategories(actor: AuthenticatedUser) {
    let categories = await this.repo.findAllCategories(actor.tenantId);
    if (categories.length === 0) {
      // Seed default helpful categories and starter articles
      const c1 = await this.repo.createCategory(
        { name: 'Getting Started', slug: 'getting-started', description: 'Essential setup, profile config, and initial CRM tour', icon: 'Rocket', position: 1 },
        actor.tenantId,
      );
      const c2 = await this.repo.createCategory(
        { name: 'Sales & Pipelines', slug: 'sales-pipelines', description: 'Managing deals, Kanban board moves, and CPQ quotes', icon: 'Kanban', position: 2 },
        actor.tenantId,
      );
      const c3 = await this.repo.createCategory(
        { name: 'Billing & Payments', slug: 'billing-payments', description: 'Invoices, payment links, tax slabs and financial records', icon: 'Receipt', position: 3 },
        actor.tenantId,
      );

      await this.repo.createArticle(
        {
          categoryId: c1.id,
          title: 'How to invite team members and assign RBAC roles',
          slug: 'how-to-invite-team-members',
          content: 'Navigate to Team Members under Admin in the left sidebar. Click Invite Member, specify their email address, and select an RBAC Role (Admin, Sales, Finance, Manager, or Support).',
          isPublished: true,
        },
        actor.tenantId,
      );

      await this.repo.createArticle(
        {
          categoryId: c2.id,
          title: 'Configuring custom stages in your sales pipeline',
          slug: 'configuring-pipeline-stages',
          content: 'You can customize your sales funnel by going to Sales Stages. Add new columns, drag to reorder, and set probability weights for accurate forecasting.',
          isPublished: true,
        },
        actor.tenantId,
      );

      categories = await this.repo.findAllCategories(actor.tenantId);
    }
    return categories;
  }

  async createCategory(dto: CreateFaqCategoryDto, actor: AuthenticatedUser) {
    return this.repo.createCategory(dto, actor.tenantId);
  }

  async findAllArticles(search: string | undefined, actor: AuthenticatedUser) {
    return this.repo.findAllArticles(search, actor.tenantId);
  }

  async findArticle(id: string) {
    const article = await this.repo.findArticleById(id);
    if (!article) throw new NotFoundException(`Article ${id} not found`);
    await this.repo.incrementViews(id);
    return article;
  }

  async createArticle(dto: CreateKnowledgeArticleDto, actor: AuthenticatedUser) {
    return this.repo.createArticle(dto, actor.tenantId);
  }

  async updateArticle(id: string, dto: UpdateKnowledgeArticleDto) {
    return this.repo.updateArticle(id, dto);
  }

  async deleteArticle(id: string) {
    return this.repo.deleteArticle(id);
  }
}
