// src/modules/tenants/tenants.controller.ts
// SADECE HTTP. Tümü platform.tenant.manage (platform-admin) gerektirir.
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantsService } from './tenants.service';
import { AssignUserDto, CreateTenantDto } from './dto/tenant.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get()
  @Permissions(PERMISSIONS.PLATFORM.TENANT_MANAGE)
  list() {
    return this.service.list();
  }

  @Post()
  @Permissions(PERMISSIONS.PLATFORM.TENANT_MANAGE)
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.create(dto, actor);
  }

  @Post(':id/assign-user')
  @Permissions(PERMISSIONS.PLATFORM.TENANT_MANAGE)
  @ApiOperation({ summary: "Kullanıcıyı tenant'a ata" })
  assignUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.assignUser(id, dto, actor);
  }
}
