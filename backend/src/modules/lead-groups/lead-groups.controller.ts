// src/modules/lead-groups/lead-groups.controller.ts
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
import { LeadGroupsService } from './lead-groups.service';
import {
  AddMembersDto,
  CreateLeadGroupDto,
  UpdateLeadGroupDto,
} from './dto/lead-group.dto';

@Controller('lead-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadGroupsController {
  constructor(private readonly service: LeadGroupsService) {}

  @Post()
  @Permissions(PERMISSIONS.LEAD_GROUP.CREATE)
  create(@Body() dto: CreateLeadGroupDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.create(dto, actor);
  }

  @Get()
  @Permissions(PERMISSIONS.LEAD_GROUP.READ)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAll(actor);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.LEAD_GROUP.READ)
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.findOne(id, actor);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.LEAD_GROUP.UPDATE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadGroupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.LEAD_GROUP.DELETE)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.remove(id, actor);
  }

  @Post(':id/members')
  @Permissions(PERMISSIONS.LEAD_GROUP.UPDATE)
  addMembers(
    @Param('id') id: string,
    @Body() dto: AddMembersDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.addMembers(id, dto.leadIds, actor);
  }

  @Delete(':id/members/:leadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.LEAD_GROUP.UPDATE)
  removeMember(
    @Param('id') id: string,
    @Param('leadId') leadId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.removeMember(id, leadId, actor);
  }
}
