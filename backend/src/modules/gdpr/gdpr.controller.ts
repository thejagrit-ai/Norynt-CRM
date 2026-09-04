// src/modules/gdpr/gdpr.controller.ts
// SADECE HTTP. Hassas: yalnız gdpr.export / gdpr.erase (ADMIN).
import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GdprService } from './gdpr.service';

@ApiTags('gdpr')
@ApiBearerAuth()
@Controller('gdpr')
export class GdprController {
  constructor(private readonly service: GdprService) {}

  @Get('contacts/:id/export')
  @Permissions(PERMISSIONS.GDPR.EXPORT)
  @ApiOperation({ summary: 'Kişinin verisini dışa aktar (taşınabilirlik)' })
  export(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.exportContact(id);
  }

  @Post('contacts/:id/erase')
  @Permissions(PERMISSIONS.GDPR.ERASE)
  @ApiOperation({ summary: 'Kişiyi sil (unutulma hakkı)' })
  erase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.eraseContact(id, actor);
  }
}
