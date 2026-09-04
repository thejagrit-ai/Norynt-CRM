// src/modules/accounting/accounting.controller.ts — muhasebe senkronu (korumalı).
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AccountingService } from './accounting.service';

@ApiTags('accounting')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get('invoices/:id')
  @Permissions(PERMISSIONS.INVOICE.READ)
  @ApiOperation({ summary: 'Faturanın muhasebe senkron durumu' })
  getSync(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getSync(id);
  }

  @Post('invoices/:id/sync')
  @Permissions(PERMISSIONS.INVOICE.UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Faturayı bağlı muhasebe sağlayıcısına gönder' })
  sync(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.syncInvoice(id);
  }
}
