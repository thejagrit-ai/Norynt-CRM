// src/modules/connections/connections.module.ts — entegrasyon bağlantıları modülü.
import { Module } from '@nestjs/common';
import { SecretCryptoService } from '../../common/crypto/secret-crypto.service';
import {
  EXT_HTTP,
  FetchExtHttpClient,
} from '../../common/http/ext-http.client';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { ConnectionsRepository } from './connections.repository';
import { OAuthService } from './oauth.service';

@Module({
  controllers: [ConnectionsController],
  providers: [
    ConnectionsService,
    ConnectionsRepository,
    SecretCryptoService,
    OAuthService,
    { provide: EXT_HTTP, useClass: FetchExtHttpClient },
  ],
  exports: [ConnectionsService, SecretCryptoService, OAuthService, EXT_HTTP],
})
export class ConnectionsModule {}
