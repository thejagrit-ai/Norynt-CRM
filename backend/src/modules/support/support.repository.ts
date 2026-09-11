// src/modules/support/support.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFaqCategoryDto,
  CreateKnowledgeArticleDto,
  UpdateKnowledgeArticleDto,
} from './dto/support.dto';

@Injectable()
export class SupportRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- FAQ Categories ---
  async createCategory(data: CreateFaqCategoryDto, tenantId?: string | null) {
    return this.prisma.faqCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon || 'HelpCircle',
        position: data.position || 0,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAllCategories(tenantId?: string | null) {
    return this.prisma.faqCategory.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        articles: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    return this.prisma.faqCategory.findUnique({
      where: { id },
      include: { articles: true },
    });
  }

  // --- Knowledge Articles ---
  async createArticle(
    data: CreateKnowledgeArticleDto,
    tenantId?: string | null,
  ) {
    return this.prisma.knowledgeArticle.create({
      data: {
        categoryId: data.categoryId,
        title: data.title,
        slug: data.slug,
        content: data.content,
        isPublished: data.isPublished ?? true,
        tenantId: tenantId ?? null,
      },
      include: { category: true },
    });
  }

  async findAllArticles(search?: string, tenantId?: string | null) {
    return this.prisma.knowledgeArticle.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findArticleById(id: string) {
    return this.prisma.knowledgeArticle.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async updateArticle(id: string, data: UpdateKnowledgeArticleDto) {
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async deleteArticle(id: string) {
    return this.prisma.knowledgeArticle.delete({ where: { id } });
  }

  async incrementViews(id: string) {
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}
