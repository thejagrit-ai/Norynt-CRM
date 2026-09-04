// src/modules/payments/payments.public.controller.ts
import {
  Body,
  Controller,
  Headers,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payments-public')
@Controller('webhooks')
export class PaymentsPublicController {
  constructor(
    private readonly service: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('payments/:provider')
  @ApiOperation({
    summary:
      'Generic webhook endpoint for payment gateways (Razorpay, Cashfree, Stripe, etc.)',
  })
  async handlePaymentWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string | string[]>,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody
      ? req.rawBody.toString('utf-8')
      : JSON.stringify(payload);
    return this.service.handleWebhook(provider, payload, headers, rawBody);
  }

  @Public()
  @Post('razorpay/callback')
  @ApiOperation({ summary: 'Razorpay checkout callback redirect' })
  async razorpayCallback(@Body() body: any, @Res() res: Response) {
    const base = (
      this.config.get<string>('APP_PUBLIC_URL') ?? 'http://localhost:3001'
    ).replace(/\/+$/, '');
    const status = body?.razorpay_payment_id ? 'success' : 'failed';
    res.redirect(
      HttpStatus.FOUND,
      `${base}/invoices?payment=${status}&ref=${body?.razorpay_payment_id || ''}`,
    );
  }

  @Public()
  @Post('iyzico/callback')
  @ApiOperation({ summary: 'Legacy gateway callback' })
  async iyzicoCallback(@Body() body: any, @Res() res: Response) {
    const base = (
      this.config.get<string>('APP_PUBLIC_URL') ?? 'http://localhost:3001'
    ).replace(/\/+$/, '');

    const token = body?.token;
    if (!token) {
      return res.redirect(HttpStatus.FOUND, `${base}/invoices?payment=failed`);
    }

    const result = await this.service.handleIyzicoCallback(token);
    if (result.success) {
      return res.redirect(HttpStatus.FOUND, `${base}/invoices?payment=success`);
    }
    return res.redirect(HttpStatus.FOUND, `${base}/invoices?payment=failed`);
  }
}
