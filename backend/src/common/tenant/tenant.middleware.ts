// src/common/tenant/tenant.middleware.ts
// Tenant çözümleme (öncelik): JWT 'tenantId' claim → 'x-tenant-id' başlığı.
// JWT'ye bağlı kullanıcılar kendi tenant'ına KİLİTLİDİR (başlıkla ezemez → izolasyon).
// tenantId null ise (platform-admin) başlıkla bir tenant'a kapsamlanabilir.
// Not: imza burada doğrulanmaz; sahte token guard'da reddedilir, handler'a ulaşmaz.
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { runWithTenant } from './tenant-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const fromJwt = this.tenantFromJwt(req);
    const header = req.headers['x-tenant-id'];
    const fromHeader = typeof header === 'string' && header ? header : null;
    // JWT claim önceliklidir; yoksa (platform-admin) başlığa düşülür.
    const tenantId = fromJwt ?? fromHeader;
    runWithTenant(tenantId, () => next());
  }

  // Access token'ın payload'ından tenantId okur (imza doğrulamadan; sadece kapsam için).
  private tenantFromJwt(req: Request): string | null {
    const authz = req.headers['authorization'];
    if (typeof authz !== 'string' || !authz.startsWith('Bearer ')) {
      return null;
    }
    const token = authz.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const json = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(json) as { tenantId?: string | null };
      return payload.tenantId ?? null;
    } catch {
      return null;
    }
  }
}
