// src/modules/api-keys/api-keys.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ApiKeysRepository } from './api-keys.repository';
import { CreateApiKeyDto, ApiKeyCreatedResponse } from './dto/api-key.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly repo: ApiKeysRepository) {}

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  async create(
    dto: CreateApiKeyDto,
    user: AuthenticatedUser,
  ): Promise<ApiKeyCreatedResponse> {
    const tenantId = user.tenantId ?? undefined;
    const randomSecret = crypto.randomBytes(24).toString('hex');
    const prefix = `crm_${randomSecret.slice(0, 8)}`;
    const rawKey = `${prefix}_${randomSecret}`;
    const keyHash = this.hashKey(rawKey);

    const record = await this.repo.create({
      name: dto.name,
      prefix,
      keyHash,
      scopes:
        dto.scopes && dto.scopes.length > 0 ? dto.scopes : ['read', 'write'],
      tenantId,
      createdById: user.id,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    this.logger.log(
      `Created new API Key '${dto.name}' (prefix: ${prefix}) by user ${user.id}`,
    );

    return {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      scopes: record.scopes,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      rawKey, // RAW KEY DISPLAYED ONLY ONCE
    };
  }

  async list(user: AuthenticatedUser) {
    const tenantId = user.tenantId ?? undefined;
    return this.repo.findMany(tenantId);
  }

  async delete(id: string, user: AuthenticatedUser) {
    const tenantId = user.tenantId ?? undefined;
    try {
      return await this.repo.delete(id, tenantId);
    } catch {
      throw new NotFoundException(`API key #${id} not found.`);
    }
  }

  async validateKey(rawKey: string) {
    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedException('Missing or invalid API key.');
    }

    const keyHash = this.hashKey(rawKey);
    const key = await this.repo.findByKeyHash(keyHash);

    if (!key) {
      throw new UnauthorizedException('Invalid API key.');
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired.');
    }

    // Update last used timestamp asynchronously
    this.repo
      .updateLastUsed(key.id)
      .catch((err) =>
        this.logger.warn(
          `Failed to update lastUsedAt for key ${key.id}: ${err.message}`,
        ),
      );

    return {
      id: key.id,
      name: key.name,
      tenantId: key.tenantId,
      createdById: key.createdById,
      scopes: key.scopes,
    };
  }
}
