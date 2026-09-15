// src/modules/connections/connections.service.ts
// Integration connections & secure credential vault. Secrets are encrypted with AES-256-GCM
// and NEVER returned plaintext to the client (strictly masked).
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SecretCryptoService } from '../../common/crypto/secret-crypto.service';
import { ConnectionsRepository } from './connections.repository';
import { CreateConnectionDto, UpdateConnectionDto } from './dto/connection.dto';
import { findProvider, PROVIDERS, testConnection } from './provider-catalog';

interface ConnRow {
  id: string;
  provider: string;
  label: string | null;
  status: string;
  secretsEnc: string | null;
  config: unknown;
  createdAt: Date;
}

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly repo: ConnectionsRepository,
    private readonly crypto: SecretCryptoService,
  ) {}

  catalog() {
    return { cryptoReady: this.crypto.isConfigured(), providers: PROVIDERS };
  }

  async list() {
    const rows = (await this.repo.list()) as ConnRow[];
    return rows.map((r) => this.toView(r));
  }

  async connect(dto: CreateConnectionDto) {
    this.ensureCrypto();
    const provider = findProvider(dto.provider);
    if (!provider) throw new BadRequestException('Unknown provider.');
    if (!provider.available) {
      throw new BadRequestException(
        'This provider is not currently available.',
      );
    }

    if (await this.repo.findByProvider(dto.provider)) {
      throw new ConflictException('This provider is already connected.');
    }

    const secrets = dto.secrets ?? {};
    const config = dto.config ?? {};
    for (const f of provider.fields) {
      if (!f.required) continue;
      const val = f.secret
        ? (secrets[f.key] ?? config[f.key])
        : (config[f.key] ?? secrets[f.key]);
      if (val === undefined || val === null || val === '') {
        throw new BadRequestException(`Required field missing: ${f.label}`);
      }
    }

    const row = await this.repo.create({
      provider: dto.provider,
      label: dto.label,
      status: provider.authType === 'oauth2' ? 'pending_auth' : 'connected',
      secretsEnc: this.crypto.encryptJson(secrets),
      config: config as Prisma.InputJsonValue,
    });
    return this.toView(row as ConnRow);
  }

  async update(id: string, dto: UpdateConnectionDto) {
    const row = await this.getOrThrow(id);
    const data: Record<string, unknown> = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.config !== undefined) data.config = dto.config;
    if (dto.secrets && Object.keys(dto.secrets).length) {
      this.ensureCrypto();
      // Filter out empty secret strings so existing secrets are not wiped if left blank
      const cleanSecrets: Record<string, string> = {};
      for (const [k, v] of Object.entries(dto.secrets)) {
        if (v && v.trim() !== '') {
          cleanSecrets[k] = v;
        }
      }

      if (Object.keys(cleanSecrets).length > 0) {
        const current = row.secretsEnc
          ? this.crypto.decryptJson<Record<string, string>>(row.secretsEnc)
          : {};
        data.secretsEnc = this.crypto.encryptJson({
          ...current,
          ...cleanSecrets,
        });
      }
    }
    const updated = await this.repo.update(
      id,
      data as Prisma.ConnectionUpdateInput,
    );
    return this.toView(updated as ConnRow);
  }

  async test(id: string) {
    const row = await this.getOrThrow(id);
    this.ensureCrypto();
    const secrets = row.secretsEnc
      ? this.crypto.decryptJson<Record<string, string>>(row.secretsEnc)
      : {};
    return testConnection(
      row.provider,
      secrets,
      (row.config ?? {}) as Record<string, unknown>,
    );
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.repo.delete(id);
    return { deleted: true };
  }

  // Internal use: get decrypted credentials for server-side processing
  async getCredentials(provider: string): Promise<{
    id: string;
    secrets: Record<string, string>;
    config: Record<string, unknown>;
  } | null> {
    const row = (await this.repo.findByProvider(provider)) as ConnRow | null;
    if (!row || row.status !== 'connected') return null;
    if (!this.crypto.isConfigured()) return null;
    let secrets: Record<string, string> = {};
    if (row.secretsEnc) {
      try {
        secrets = this.crypto.decryptJson<Record<string, string>>(
          row.secretsEnc,
        );
      } catch {
        return null;
      }
    }
    return {
      id: row.id,
      secrets,
      config: (row.config ?? {}) as Record<string, unknown>,
    };
  }

  private ensureCrypto() {
    if (!this.crypto.isConfigured()) {
      throw new BadRequestException(
        'Secret encryption master key is not configured on the server.',
      );
    }
  }

  private async getOrThrow(id: string): Promise<ConnRow> {
    const row = (await this.repo.findById(id)) as ConnRow | null;
    if (!row) throw new NotFoundException('Connection record not found.');
    return row;
  }

  private toView(row: ConnRow) {
    const def = findProvider(row.provider);
    const secretKeys =
      def?.fields.filter((f) => f.secret).map((f) => f.key) ?? [];
    return {
      id: row.id,
      provider: row.provider,
      providerName: def?.name ?? row.provider,
      category: def?.category ?? 'other',
      label: row.label,
      status: row.status,
      secretFields: secretKeys,
      config: (row.config as Record<string, unknown>) ?? {},
      createdAt: row.createdAt,
    };
  }
}
