// src/modules/custom-reports/custom-reports.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CustomReportsService } from './custom-reports.service';
import { CreateCustomReportDto, ExecuteReportDto } from './dto/custom-report.dto';

@Controller('reports/custom')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomReportsController {
  constructor(private readonly service: CustomReportsService) {}

  @Get()
  @Permissions(PERMISSIONS.CUSTOM_REPORT.READ)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.service.findAll(actor);
  }

  @Post()
  @Permissions(PERMISSIONS.CUSTOM_REPORT.CREATE)
  create(
    @Body() dto: CreateCustomReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.create(dto, actor);
  }

  @Post('execute')
  @Permissions(PERMISSIONS.CUSTOM_REPORT.EXECUTE)
  execute(
    @Body() dto: ExecuteReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.execute(dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.CUSTOM_REPORT.DELETE)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
