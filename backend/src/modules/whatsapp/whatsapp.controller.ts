// src/modules/whatsapp/whatsapp.controller.ts — WhatsApp gönderim + gelen kutusu (korumalı).
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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { WhatsAppService } from './whatsapp.service';
import { SendWhatsAppDto } from './dto/whatsapp.dto';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly service: WhatsAppService) {}

  @Get('status')
  @Permissions(PERMISSIONS.WHATSAPP.READ)
  status() {
    return this.service.status();
  }

  @Post('send')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Metin mesajı gönder (sonuç kayda geçer)' })
  send(@Body() dto: SendWhatsAppDto) {
    return this.service.send(dto);
  }

  @Get('conversations')
  @Permissions(PERMISSIONS.WHATSAPP.READ)
  conversations() {
    return this.service.conversations();
  }

  @Get('thread/:phone')
  @Permissions(PERMISSIONS.WHATSAPP.READ)
  thread(@Param('phone') phone: string) {
    return this.service.thread(phone);
  }

  // --- Broadcasts ---
  @Get('broadcasts')
  @Permissions(PERMISSIONS.WHATSAPP.READ)
  listBroadcasts() {
    return this.service.listBroadcasts();
  }

  @Post('broadcasts')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  createBroadcast(@Body() dto: any) {
    return this.service.createBroadcast(dto, 'system');
  }

  @Post('broadcasts/:id/send')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  sendBroadcast(@Param('id') id: string) {
    return this.service.sendBroadcast(id);
  }

  @Delete('broadcasts/:id')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  deleteBroadcast(@Param('id') id: string) {
    return this.service.deleteBroadcast(id);
  }

  // --- HSM Templates ---
  @Get('templates')
  @Permissions(PERMISSIONS.WHATSAPP.READ)
  listTemplates() {
    return this.service.listTemplates();
  }

  @Post('templates')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  createTemplate(@Body() dto: any) {
    return this.service.createTemplate(dto);
  }

  @Patch('templates/:id')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  updateTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // --- Quick Replies ---
  @Get('quick-replies')
  @Permissions(PERMISSIONS.WHATSAPP.READ)
  listQuickReplies() {
    return this.service.listQuickReplies();
  }

  @Post('quick-replies')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  createQuickReply(@Body() dto: any) {
    return this.service.createQuickReply(dto, 'system');
  }

  @Patch('quick-replies/:id')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  updateQuickReply(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateQuickReply(id, dto);
  }

  @Delete('quick-replies/:id')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  deleteQuickReply(@Param('id') id: string) {
    return this.service.deleteQuickReply(id);
  }

  // --- Workflows ---
  @Get('workflows')
  @Permissions(PERMISSIONS.WHATSAPP.READ)
  listWorkflows() {
    return this.service.listWorkflows();
  }

  @Post('workflows')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  createWorkflow(@Body() dto: any) {
    return this.service.createWorkflow(dto);
  }

  @Patch('workflows/:id')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  updateWorkflow(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateWorkflow(id, dto);
  }

  @Delete('workflows/:id')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  deleteWorkflow(@Param('id') id: string) {
    return this.service.deleteWorkflow(id);
  }

  @Patch('workflows/:id/toggle')
  @Permissions(PERMISSIONS.WHATSAPP.SEND)
  toggleWorkflow(@Param('id') id: string) {
    return this.service.toggleWorkflow(id);
  }
}
