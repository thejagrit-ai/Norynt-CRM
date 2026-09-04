// src/modules/audit/audit.module.ts
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { AuditInterceptor } from './audit.interceptor';

// Global: AuditInterceptor tüm rotalarda mutasyonları kaydeder.
@Global()
@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditRepository,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService],
})
export class AuditModule {}
