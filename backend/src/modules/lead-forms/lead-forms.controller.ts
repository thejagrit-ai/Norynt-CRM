// src/modules/lead-forms/lead-forms.controller.ts — Lead intake formu yönetimi (korumalı).
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { LeadFormsService } from './lead-forms.service';
import {
  CreateLeadFormDto,
  QueryLeadFormDto,
  UpdateLeadFormDto,
} from './dto/lead-form.dto';

@ApiTags('lead-forms')
@ApiBearerAuth()
@Controller('lead-forms')
export class LeadFormsController {
  constructor(private readonly service: LeadFormsService) {}

  @Post()
  @Permissions(PERMISSIONS.LEAD_FORM.MANAGE)
  @ApiOperation({ summary: 'Form oluştur (publicKey + secret bir kez döner)' })
  create(
    @Body() dto: CreateLeadFormDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.create(dto, actor);
  }

  @Get()
  @Permissions(PERMISSIONS.LEAD_FORM.READ)
  findAll(@Query() q: QueryLeadFormDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.LEAD_FORM.READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/secret')
  @Permissions(PERMISSIONS.LEAD_FORM.MANAGE)
  @ApiOperation({ summary: 'Webhook secret göster (yalnız yönetim)' })
  reveal(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.revealSecret(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.LEAD_FORM.MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadFormDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/rotate-secret')
  @Permissions(PERMISSIONS.LEAD_FORM.MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook secret yenile (eski geçersiz olur)' })
  rotate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.rotateSecret(id);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.LEAD_FORM.MANAGE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
