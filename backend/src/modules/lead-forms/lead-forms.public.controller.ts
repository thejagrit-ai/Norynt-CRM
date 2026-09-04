// src/modules/lead-forms/lead-forms.public.controller.ts
// PUBLIC uçlar (global JwtAuthGuard'dan muaf, bilinçli @Public):
//   GET  /public/lead-forms/:publicKey         → embed render config (secret YOK)
//   POST /public/lead-forms/:publicKey/submit  → tarayıcı formu (imzasız) → FORM kanalı
//   POST /webhooks/leads/:publicKey            → sunucu-sunucu (HMAC zorunlu) → WEBHOOK kanalı
// Not: submit ucu tanımsız alanlara izin verir (form-özel alanlar) → DTO yerine ham gövde;
// validasyon servis katmanında, ham gövde meta'ya yazılır.
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { LeadFormsService } from './lead-forms.service';

@ApiTags('lead-forms-public')
@Controller()
export class LeadFormsPublicController {
  constructor(private readonly service: LeadFormsService) {}

  @Public()
  @Get('public/lead-forms/:publicKey')
  @ApiOperation({ summary: 'Embed form yapılandırması (public)' })
  config(@Param('publicKey') publicKey: string) {
    return this.service.getPublicConfig(publicKey);
  }

  @Public()
  @Post('public/lead-forms/:publicKey/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Embed form gönderimi (imzasız, public)' })
  submit(
    @Param('publicKey') publicKey: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.submit(publicKey, body ?? {});
  }

  @Public()
  @Post('webhooks/leads/:publicKey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook ile lead alımı (HMAC imza zorunlu)',
  })
  webhook(
    @Param('publicKey') publicKey: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-crm-signature') signature?: string,
    @Headers('x-crm-timestamp') timestamp?: string,
  ) {
    return this.service.ingestWebhook({
      publicKey,
      rawBody: req.rawBody?.toString() ?? '',
      signature,
      timestamp,
    });
  }
}
