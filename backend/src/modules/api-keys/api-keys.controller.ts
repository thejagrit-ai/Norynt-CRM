// src/modules/api-keys/api-keys.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/api-key.dto';

@ApiTags('api-keys')
@ApiBearerAuth()
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Get()
  @Permissions(PERMISSIONS.INTEGRATION.READ)
  @ApiOperation({ summary: 'Geliştirici API anahtarlarını listele' })
  list(@CurrentUser() actor: AuthenticatedUser) {
    return this.apiKeys.list(actor);
  }

  @Post()
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({
    summary:
      'Yeni bir geliştirici API anahtarı oluştur (Ham anahtar yalnızca 1 kez gösterilir)',
  })
  create(
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.apiKeys.create(dto, actor);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({ summary: 'API anahtarını iptal et / sil' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.apiKeys.delete(id, actor);
  }
}
