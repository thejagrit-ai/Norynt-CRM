// src/modules/settings/settings.controller.ts
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
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import {
  CreateAssignmentRuleDto,
  CreateLeadMasterDto,
  CreateSlaPolicyDto,
  UpdateChatbotConfigDto,
  UpdateSubscriptionDto,
} from './dto/settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  // --- Overview ---
  @Get('overview')
  getOverview(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.getOverview(actor);
  }

  // --- My Plan & Subscription ---
  @Get('my-plan')
  getSubscription(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.getSubscription(actor);
  }

  @Post('my-plan/upgrade')
  updateSubscription(
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.updateSubscription(dto, actor);
  }

  // --- Ticket SLA Policies ---
  @Get('sla')
  getSlaPolicies(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.getSlaPolicies(actor);
  }

  @Post('sla')
  upsertSlaPolicy(
    @Body() dto: CreateSlaPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.upsertSlaPolicy(dto, actor);
  }

  // --- Lead Masters ---
  @Get('lead-masters')
  getLeadMasters(
    @Query('category') category: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.getLeadMasters(category, actor);
  }

  @Post('lead-masters')
  createLeadMaster(
    @Body() dto: CreateLeadMasterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createLeadMaster(dto, actor);
  }

  @Delete('lead-masters/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLeadMaster(@Param('id') id: string) {
    return this.service.deleteLeadMaster(id);
  }

  // --- Auto-Assignment Rules ---
  @Get('assignment-rules')
  getAssignmentRules(
    @Query('type') type: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.getAssignmentRules(type, actor);
  }

  @Post('assignment-rules')
  createAssignmentRule(
    @Body() dto: CreateAssignmentRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createAssignmentRule(dto, actor);
  }

  @Patch('assignment-rules/:id')
  updateAssignmentRule(@Param('id') id: string, @Body() data: any) {
    return this.service.updateAssignmentRule(id, data);
  }

  @Delete('assignment-rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssignmentRule(@Param('id') id: string) {
    return this.service.deleteAssignmentRule(id);
  }

  // --- Chatbot Config ---
  @Get('chatbot')
  getChatbotConfig(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.getChatbotConfig(actor);
  }

  @Patch('chatbot')
  updateChatbotConfig(
    @Body() dto: UpdateChatbotConfigDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.updateChatbotConfig(dto, actor);
  }
}
