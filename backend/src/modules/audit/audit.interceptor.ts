// src/modules/audit/audit.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { redactSecrets } from '../../common/utils/secret-redaction.util';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: any }>();
    const res = http.getResponse<Response>();

    if (!MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    const { method, originalUrl, ip, user } = req;
    const path = (originalUrl || req.url || '').split('?')[0];

    // Identify entity and entityId from REST path
    const parts = path.replace(/^\/api(\/v\d+)?\//, '').split('/');
    const entity = parts[0] || 'system';
    const entityId =
      parts[1] && !parts[1].startsWith('?') ? parts[1] : undefined;

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      ip ||
      '127.0.0.1';

    const actorId = user?.id || user?.sub || null;
    const actorEmail = user?.email || null;
    const actorRole = Array.isArray(user?.roles)
      ? user.roles[0]
      : typeof user?.role === 'string'
        ? user.role
        : null;

    const sanitizedBody = req.body ? redactSecrets(req.body) : undefined;

    return next.handle().pipe(
      tap({
        next: (data) => {
          void this.audit.record({
            actorId,
            actorEmail,
            actorRole,
            action: `${method}_${entity.toUpperCase()}`,
            entity: entity.toUpperCase(),
            entityId,
            description: `${method} ${path} completed successfully`,
            path,
            statusCode: res.statusCode || 200,
            ip: clientIp,
            userAgent,
            after: sanitizedBody,
            metadata: data
              ? redactSecrets(
                  typeof data === 'object'
                    ? { resultCount: Array.isArray(data) ? data.length : 1 }
                    : null,
                )
              : undefined,
            tenantId: user?.tenantId || null,
          });
        },
        error: (err) => {
          void this.audit.record({
            actorId,
            actorEmail,
            actorRole,
            action: `${method}_${entity.toUpperCase()}_FAILED`,
            entity: entity.toUpperCase(),
            entityId,
            description: `${method} ${path} failed: ${err.message || 'Error'}`,
            path,
            statusCode: err.status || 500,
            ip: clientIp,
            userAgent,
            after: sanitizedBody,
            metadata: { error: err.message },
            tenantId: user?.tenantId || null,
          });
        },
      }),
    );
  }
}
