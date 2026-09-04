// src/modules/support/support.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';
import {
  CreateFaqCategoryDto,
  CreateKnowledgeArticleDto,
  UpdateKnowledgeArticleDto,
} from './dto/support.dto';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get('categories')
  @Permissions(PERMISSIONS.SUPPORT.READ)
  findAllCategories(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllCategories(actor);
  }

  @Post('categories')
  @Permissions(PERMISSIONS.SUPPORT.MANAGE)
  createCategory(
    @Body() dto: CreateFaqCategoryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createCategory(dto, actor);
  }

  @Get('articles')
  @Permissions(PERMISSIONS.SUPPORT.READ)
  findAllArticles(
    @Query('q') q: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.findAllArticles(q, actor);
  }

  @Get('articles/:id')
  @Permissions(PERMISSIONS.SUPPORT.READ)
  findArticle(@Param('id') id: string) {
    return this.service.findArticle(id);
  }

  @Post('articles')
  @Permissions(PERMISSIONS.SUPPORT.MANAGE)
  createArticle(
    @Body() dto: CreateKnowledgeArticleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createArticle(dto, actor);
  }

  @Patch('articles/:id')
  @Permissions(PERMISSIONS.SUPPORT.MANAGE)
  updateArticle(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeArticleDto,
  ) {
    return this.service.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.SUPPORT.MANAGE)
  deleteArticle(@Param('id') id: string) {
    return this.service.deleteArticle(id);
  }
}
