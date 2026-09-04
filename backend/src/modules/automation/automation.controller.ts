// src/modules/automation/automation.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AutomationService } from './automation.service';
import {
  CreateRuleDto,
  QueryRuleDto,
  UpdateRuleDto,
} from './dto/automation.dto';

@ApiTags('automation')
@ApiBearerAuth()
@Controller('automation/rules')
export class AutomationController {
  constructor(private readonly service: AutomationService) {}

  @Post()
  @Permissions(PERMISSIONS.AUTOMATION.MANAGE)
  create(@Body() dto: CreateRuleDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.create(dto, actor);
  }

  @Get()
  @Permissions(PERMISSIONS.AUTOMATION.READ)
  findAll(@Query() q: QueryRuleDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.AUTOMATION.READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.AUTOMATION.MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.AUTOMATION.MANAGE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
