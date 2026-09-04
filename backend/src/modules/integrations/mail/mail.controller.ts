// src/modules/integrations/mail/mail.controller.ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permission.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { MailService, EmailSettingsDto } from './mail.service';
import { AuditService } from '../../audit/audit.service';

@Controller('email')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly audit: AuditService,
  ) {}

  @Get('settings')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  async getSettings() {
    return this.mailService.getSettings();
  }

  @Post('settings')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  async updateSettings(
    @Body() dto: EmailSettingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const updated = await this.mailService.updateSettings(dto, actor?.id);
    void this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'UPDATE_SMTP_SETTINGS',
      entity: 'SMTP',
      description: `SMTP settings updated (Host: ${dto.host}:${dto.port})`,
      path: '/api/v1/email/settings',
      statusCode: 200,
      after: {
        host: dto.host,
        port: dto.port,
        from: dto.from,
        secure: dto.secure,
      },
    });
    return updated;
  }

  @Post('settings/test-connection')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  async testConnection(@Body() dto?: any) {
    return this.mailService.testConnection(dto?.host ? dto : undefined);
  }

  @Post('settings/send-test')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  async sendTestEmail(
    @Body('to') to: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const result = await this.mailService.sendTestEmail(to || actor.email);
    void this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'SEND_TEST_EMAIL',
      entity: 'SMTP',
      description: `Test email dispatched to ${to || actor.email}`,
      path: '/api/v1/email/settings/send-test',
      statusCode: 200,
      metadata: { recipient: to || actor.email },
    });
    return result;
  }
}
