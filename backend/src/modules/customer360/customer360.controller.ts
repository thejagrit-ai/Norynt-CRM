// src/modules/customer360/customer360.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Customer360Service } from './customer360.service';

@Controller('customer-360')
@UseGuards(JwtAuthGuard, RolesGuard)
export class Customer360Controller {
  constructor(private readonly service: Customer360Service) {}

  @Get(':id')
  @Permissions(PERMISSIONS.CUSTOMER_360.READ)
  getCustomer360(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.getCustomer360(id, actor);
  }
}
