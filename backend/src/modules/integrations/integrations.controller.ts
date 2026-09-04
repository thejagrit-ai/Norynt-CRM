// src/modules/integrations/integrations.controller.ts
// SADECE HTTP. Inbound endpoint @Public ama imza zorunlu (yetki imzayla).
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IntegrationsService } from './integrations.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Post('webhooks')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({ summary: 'Webhook aboneliği oluştur (secret bir kez döner)' })
  create(
    @Body() dto: CreateWebhookDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.createWebhook(dto, actor);
  }

  @Get('webhooks')
  @Permissions(PERMISSIONS.INTEGRATION.READ)
  @ApiOperation({ summary: 'Abonelikleri listele (secret gizli)' })
  list() {
    return this.service.listWebhooks();
  }

  @Delete('webhooks/:id')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({ summary: 'Abonelik sil' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteWebhook(id);
  }

  @Post('webhooks/:id/test')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test olayı gönder' })
  test(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.testWebhook(id, actor);
  }

  @Get('webhooks/:id/deliveries')
  @Permissions(PERMISSIONS.INTEGRATION.READ)
  @ApiOperation({ summary: 'Teslimat geçmişi' })
  deliveries(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listDeliveries(id);
  }

  // Gelen webhook: dış sistem JWT taşımaz; yetki HMAC imzasıyla. İmzasız → 401.
  @Public()
  @Post('webhooks/inbound/:source')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gelen webhook (HMAC imzalı)' })
  inbound(
    @Param('source') source: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody?.toString() ?? '';
    return this.service.handleInbound({
      source,
      rawBody,
      signature: req.header('x-crm-signature'),
      timestamp: req.header('x-crm-timestamp'),
      deliveryId: req.header('x-crm-delivery'),
    });
  }
}
