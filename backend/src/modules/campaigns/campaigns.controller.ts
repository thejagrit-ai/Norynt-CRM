// src/modules/campaigns/campaigns.controller.ts
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
import { CampaignsService } from './campaigns.service';
import {
  CreateEmailCampaignDto,
  CreateFunnelDto,
  CreateSmsCampaignDto,
  CreateTemplateDto,
  CreateWarmupProfileDto,
  UpdateEmailCampaignDto,
  UpdateTemplateDto,
} from './dto/campaigns.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  // --- Email Campaigns ---
  @Post('email')
  @Permissions(PERMISSIONS.CAMPAIGN.CREATE)
  createEmail(
    @Body() dto: CreateEmailCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createEmail(dto, actor);
  }

  @Get('email')
  @Permissions(PERMISSIONS.CAMPAIGN.READ)
  findAllEmails(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllEmails(actor);
  }

  @Get('email/:id')
  @Permissions(PERMISSIONS.CAMPAIGN.READ)
  findEmail(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.findEmail(id, actor);
  }

  @Patch('email/:id')
  @Permissions(PERMISSIONS.CAMPAIGN.UPDATE)
  updateEmail(
    @Param('id') id: string,
    @Body() dto: UpdateEmailCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.updateEmail(id, dto, actor);
  }

  @Post('email/:id/send')
  @Permissions(PERMISSIONS.CAMPAIGN.SEND)
  sendEmail(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.sendEmailCampaign(id, actor);
  }

  @Delete('email/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.CAMPAIGN.DELETE)
  deleteEmail(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.deleteEmail(id, actor);
  }

  // --- SMS Campaigns ---
  @Post('sms')
  @Permissions(PERMISSIONS.CAMPAIGN.CREATE)
  createSms(
    @Body() dto: CreateSmsCampaignDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createSms(dto, actor);
  }

  @Get('sms')
  @Permissions(PERMISSIONS.CAMPAIGN.READ)
  findAllSms(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllSms(actor);
  }

  @Post('sms/:id/send')
  @Permissions(PERMISSIONS.CAMPAIGN.SEND)
  sendSms(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.sendSmsCampaign(id, actor);
  }

  @Delete('sms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.CAMPAIGN.DELETE)
  deleteSms(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.deleteSms(id, actor);
  }

  // --- Templates ---
  @Post('templates')
  @Permissions(PERMISSIONS.TEMPLATE.CREATE)
  createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createTemplate(dto, actor);
  }

  @Get('templates')
  @Permissions(PERMISSIONS.TEMPLATE.READ)
  findAllTemplates(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllTemplates(actor);
  }

  @Patch('templates/:id')
  @Permissions(PERMISSIONS.TEMPLATE.UPDATE)
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.updateTemplate(id, dto, actor);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.TEMPLATE.DELETE)
  deleteTemplate(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.deleteTemplate(id, actor);
  }

  // --- Warmup ---
  @Get('warmup')
  @Permissions(PERMISSIONS.CAMPAIGN.READ)
  getWarmup(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.getWarmupProfiles(actor);
  }

  @Post('warmup')
  @Permissions(PERMISSIONS.CAMPAIGN.CREATE)
  createWarmup(
    @Body() dto: CreateWarmupProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createWarmupProfile(dto, actor);
  }

  @Patch('warmup/:id/status')
  @Permissions(PERMISSIONS.CAMPAIGN.UPDATE)
  toggleWarmup(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.toggleWarmup(id, status, actor);
  }

  // --- Funnels ---
  @Get('funnels')
  @Permissions(PERMISSIONS.FUNNEL.READ)
  findAllFunnels(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllFunnels(actor);
  }

  @Post('funnels')
  @Permissions(PERMISSIONS.FUNNEL.CREATE)
  createFunnel(
    @Body() dto: CreateFunnelDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createFunnel(dto, actor);
  }

  @Delete('funnels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.FUNNEL.DELETE)
  deleteFunnel(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.deleteFunnel(id, actor);
  }
}
