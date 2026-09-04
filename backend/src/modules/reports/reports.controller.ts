// src/modules/reports/reports.controller.ts
import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('pipeline')
  @Permissions(PERMISSIONS.DEAL.READ)
  pipeline(@Query('pipelineId', ParseUUIDPipe) pipelineId: string) {
    return this.service.pipeline(pipelineId);
  }

  @Get('deals/summary')
  @Permissions(PERMISSIONS.DEAL.READ)
  dealsSummary() {
    return this.service.dealsSummary();
  }

  @Get('forecast')
  @Permissions(PERMISSIONS.DEAL.READ)
  forecast() {
    return this.service.forecast();
  }

  @Get('deals/forecast')
  @Permissions(PERMISSIONS.DEAL.READ)
  dealsForecast() {
    return this.service.forecast();
  }

  // Finansal özet yalnız invoice.read_financial ile.
  @Get('invoices/summary')
  @Permissions(PERMISSIONS.INVOICE.READ_FINANCIAL)
  invoicesSummary() {
    return this.service.invoicesSummary();
  }

  // Aylık ciro (faturalanan + tahsil) — finansal yetki gerektirir.
  @Get('revenue/monthly')
  @Permissions(PERMISSIONS.INVOICE.READ_FINANCIAL)
  revenueMonthly(@Query('months') months?: string) {
    return this.service.revenueMonthly(Number(months) || 12);
  }

  @Get('sales/by-owner')
  @Permissions(PERMISSIONS.DEAL.READ)
  salesByOwner() {
    return this.service.salesByOwner();
  }

  @Get('products/top')
  @Permissions(PERMISSIONS.DEAL.READ)
  topProducts(@Query('limit') limit?: string) {
    return this.service.topProducts(Number(limit) || 10);
  }

  @Get('deals/won-lost')
  @Permissions(PERMISSIONS.DEAL.READ)
  wonLost(@Query('months') months?: string) {
    return this.service.wonLostMonthly(Number(months) || 6);
  }
}
