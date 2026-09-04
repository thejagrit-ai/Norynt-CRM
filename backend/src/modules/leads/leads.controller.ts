// src/modules/leads/leads.controller.ts — nitelenmemiş Lead + dönüştürme.
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
import { LeadsService } from './leads.service';
import {
  ConvertLeadDto,
  CreateLeadDto,
  QueryLeadDto,
  UpdateLeadDto,
} from './dto/lead.dto';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Post()
  @Permissions(PERMISSIONS.LEAD.CREATE)
  create(@Body() dto: CreateLeadDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.create(dto, actor);
  }

  @Get()
  @Permissions(PERMISSIONS.LEAD.READ)
  findAll(@Query() q: QueryLeadDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.LEAD.READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.LEAD.UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/convert')
  @Permissions(PERMISSIONS.LEAD.CONVERT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lead → Contact + Deal dönüştür (opsiyonel override)',
  })
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.service.convert(id, actor, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.LEAD.DELETE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
