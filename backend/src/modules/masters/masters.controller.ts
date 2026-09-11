// src/modules/masters/masters.controller.ts
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
import { MastersService } from './masters.service';
import {
  CreateTaxSlabDto,
  CreateTncSetDto,
  CreateUomDto,
} from './dto/masters.dto';

@Controller('masters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MastersController {
  constructor(private readonly service: MastersService) {}

  // --- Tax Slabs ---
  @Get('tax-slabs')
  @Permissions(PERMISSIONS.MASTER.READ)
  findAllTaxSlabs(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllTaxSlabs(actor);
  }

  @Post('tax-slabs')
  @Permissions(PERMISSIONS.MASTER.CREATE)
  createTaxSlab(
    @Body() dto: CreateTaxSlabDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createTaxSlab(dto, actor);
  }

  @Patch('tax-slabs/:id')
  @Permissions(PERMISSIONS.MASTER.UPDATE)
  updateTaxSlab(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateTaxSlab(id, dto);
  }

  @Delete('tax-slabs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.MASTER.DELETE)
  deleteTaxSlab(@Param('id') id: string) {
    return this.service.deleteTaxSlab(id);
  }

  // --- UOM ---
  @Get('uom')
  @Permissions(PERMISSIONS.MASTER.READ)
  findAllUoms(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllUoms(actor);
  }

  @Post('uom')
  @Permissions(PERMISSIONS.MASTER.CREATE)
  createUom(
    @Body() dto: CreateUomDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createUom(dto, actor);
  }

  @Patch('uom/:id')
  @Permissions(PERMISSIONS.MASTER.UPDATE)
  updateUom(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateUom(id, dto);
  }

  @Delete('uom/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.MASTER.DELETE)
  deleteUom(@Param('id') id: string) {
    return this.service.deleteUom(id);
  }

  // --- T&C Sets ---
  @Get('tnc-sets')
  @Permissions(PERMISSIONS.MASTER.READ)
  findAllTncSets(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAllTncSets(actor);
  }

  @Post('tnc-sets')
  @Permissions(PERMISSIONS.MASTER.CREATE)
  createTncSet(
    @Body() dto: CreateTncSetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createTncSet(dto, actor);
  }

  @Patch('tnc-sets/:id')
  @Permissions(PERMISSIONS.MASTER.UPDATE)
  updateTncSet(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateTncSet(id, dto);
  }

  @Delete('tnc-sets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.MASTER.DELETE)
  deleteTncSet(@Param('id') id: string) {
    return this.service.deleteTncSet(id);
  }
}
