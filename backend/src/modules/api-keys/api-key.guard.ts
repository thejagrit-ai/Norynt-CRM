// src/modules/api-keys/api-key.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['X-API-KEY'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException(
        'Missing X-API-KEY header for external API access.',
      );
    }

    const validated = await this.apiKeysService.validateKey(apiKey);

    // Attach developer user context
    request.user = {
      id: validated.createdById,
      email: `api-key-${validated.name}@developer.crm`,
      roles: ['DEVELOPER'],
      tenantId: validated.tenantId,
      permissions: validated.scopes,
      isApiKey: true,
      apiKeyId: validated.id,
    };

    return true;
  }
}
