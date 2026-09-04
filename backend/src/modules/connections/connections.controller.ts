// src/modules/connections/connections.controller.ts — entegrasyon bağlantıları (korumalı).
// İzin: mevcut integration.read / integration.manage (bağlantılar = entegrasyon yönetimi).
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PERMISSIONS } from '../../common/constants/permission.enum';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ConnectionsService } from './connections.service';
import { OAuthService } from './oauth.service';
import { CreateConnectionDto, UpdateConnectionDto } from './dto/connection.dto';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
export class ConnectionsController {
  constructor(
    private readonly service: ConnectionsService,
    private readonly oauth: OAuthService,
  ) {}

  // OAuth callback — tarayıcı yönlendirmesi JWT taşımaz; yetki state ile (bilinçli @Public).
  @Public()
  @Get('oauth/callback')
  @ApiOperation({
    summary: 'OAuth2 callback (state doğrulamalı, panele yönlendirir)',
  })
  async oauthCallback(
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const target = await this.oauth.callback(query);
    res.redirect(target);
  }

  @Get(':id/oauth/start')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({ summary: 'OAuth2 yetkilendirme URLini üret' })
  oauthStart(@Param('id', ParseUUIDPipe) id: string) {
    return this.oauth.start(id);
  }

  @Get('catalog')
  @Permissions(PERMISSIONS.INTEGRATION.READ)
  @ApiOperation({ summary: 'Sağlayıcı kataloğu (+ şifreleme hazır mı)' })
  catalog() {
    return this.service.catalog();
  }

  @Get()
  @Permissions(PERMISSIONS.INTEGRATION.READ)
  @ApiOperation({ summary: 'Bağlı entegrasyonlar (sırlar maskeli)' })
  list() {
    return this.service.list();
  }

  @Post()
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @ApiOperation({ summary: 'Sağlayıcı bağla (sırlar şifreli saklanır)' })
  connect(@Body() dto: CreateConnectionDto) {
    return this.service.connect(dto);
  }

  @Post(':id/test')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bağlantıyı test et (ping)' })
  test(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.test(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConnectionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.INTEGRATION.MANAGE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
