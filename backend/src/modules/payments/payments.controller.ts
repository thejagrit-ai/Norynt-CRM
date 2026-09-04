// src/modules/payments/payments.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import {
  InitiatePaymentDto,
  PaymentSettingsDto,
  RefundPaymentDto,
} from './dto/initiate-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // ─── INVOICE PAYMENT INITIATION ───

  @Post('invoices/:id/pay')
  @Permissions(
    PERMISSIONS.INVOICE.UPDATE,
    PERMISSIONS.INVOICE.READ_FINANCIAL,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate payment for an invoice with configured gateway',
  })
  initiate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const fwd = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0])?.trim() ||
      req.ip ||
      '127.0.0.1';
    return this.service.initiate(id, dto, actor, ip);
  }

  @Post('invoices/:id/pay/iyzico')
  @Permissions(
    PERMISSIONS.INVOICE.UPDATE,
    PERMISSIONS.INVOICE.READ_FINANCIAL,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legacy alias for invoice payment initiation' })
  initiateLegacy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const fwd = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0])?.trim() ||
      req.ip ||
      '127.0.0.1';
    return this.service.initiate(
      id,
      { ...dto, provider: 'iyzico' },
      actor,
      ip,
    );
  }

  // ─── ADMIN PAYMENT SETTINGS ───

  @Get('payments/settings')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({
    summary: 'Get current payment gateway configuration and active providers',
  })
  getSettings() {
    return this.service.getPaymentSettings();
  }

  @Post('payments/settings')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({
    summary: 'Update default payment provider, currency and credentials',
  })
  updateSettings(
    @Body() dto: PaymentSettingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.updatePaymentSettings(dto, actor);
  }

  @Post('payments/settings/test-connection')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({ summary: 'Test connection with a payment provider gateway' })
  testConnection(
    @Body() body: { provider: string; credentials?: Record<string, string> },
  ) {
    return this.service.testConnection(body.provider, body.credentials);
  }

  // ─── TRANSACTIONS & REFUNDS ───

  @Get('payments/history')
  @Permissions(PERMISSIONS.INVOICE.READ_FINANCIAL)
  @ApiOperation({ summary: 'List all payment transactions across gateways' })
  getHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.service.getTransactionHistory({
      page: Number(page) || 1,
      limit: Number(limit) || 25,
      status,
    });
  }

  @Post('payments/:id/refund')
  @Permissions(PERMISSIONS.INVOICE.UPDATE)
  @ApiOperation({ summary: 'Process refund for a settled transaction' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.refund(id, dto, actor);
  }
}
