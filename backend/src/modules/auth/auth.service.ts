// src/modules/auth/auth.service.ts
// Core Authentication Service: password validation, token issuance, refresh rotation, and session management.
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AccessTokenPayload } from './strategies/jwt.strategy';

const DUMMY_BCRYPT_HASH =
  '$2b$12$abcdefghijklmnopqrstuuFwN9Yl9c2/4kqfX3sQ1zr2mNQ0Pa8Vy';

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // RefreshToken.id
}

export interface AuthUserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  tenantId?: string | null;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: AuthUserView;
}

@Injectable()
export class AuthService {
  private readonly bcryptCost: number;

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.bcryptCost = Number(this.config.get<number>('BCRYPT_COST', 12));
  }

  async register(dto: RegisterDto): Promise<AuthUserView> {
    const existing = await this.authRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('This email address is already registered.');
    }
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptCost);
    const user = await this.authRepo.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.toUserView(user);
  }

  async validateAndLogin(dto: LoginDto): Promise<LoginResult> {
    const user = await this.authRepo.findByEmail(dto.email);
    const hashToCompare = user?.passwordHash ?? DUMMY_BCRYPT_HASH;
    const bcryptOk = await bcrypt.compare(dto.password, hashToCompare);

    const passwordOk = bcryptOk;

    if (!user || !passwordOk || !user.isActive) {
      throw new UnauthorizedException(
        'Invalid credentials. Please verify your email and password.',
      );
    }
    return this.issueTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<LoginResult> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshTokenPayload>(
        rawRefreshToken,
        { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    const stored = await this.authRepo.findRefreshTokenById(payload.jti);
    if (!stored || stored.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    if (stored.revokedAt) {
      await this.authRepo.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Session security violation detected.');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session has expired.');
    }

    if (this.hashToken(rawRefreshToken) !== stored.tokenHash) {
      await this.authRepo.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Invalid or expired session.');
    }

    const user = await this.authRepo.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    await this.authRepo.revokeRefreshToken(stored.id);
    return this.issueTokens(user);
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(
        rawRefreshToken,
        { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET') },
      );
      const stored = await this.authRepo.findRefreshTokenById(payload.jti);
      if (stored && !stored.revokedAt) {
        await this.authRepo.revokeRefreshToken(stored.id);
      }
    } catch {
      // Ignore invalid token on logout
    }
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string },
  ): Promise<AuthUserView> {
    const user = await this.authRepo.updateUserProfile(userId, data);
    return this.toUserView(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }
    const hashToCompare = user.passwordHash ?? DUMMY_BCRYPT_HASH;
    const bcryptOk = await bcrypt.compare(currentPassword, hashToCompare);
    if (!bcryptOk) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const newHash = await bcrypt.hash(newPassword, this.bcryptCost);
    await this.authRepo.updateUserPassword(userId, newHash);
    return { success: true, message: 'Password updated successfully.' };
  }

  // --- Helpers ---

  private async issueTokens(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId?: string | null;
    roles: { role: { name: string } }[];
  }): Promise<LoginResult> {
    const roles = user.roles.map((ur) => ur.role.name);

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      roles,
      tenantId: user.tenantId ?? null,
    };
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    });

    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '7d');
    const expiresAt = new Date(Date.now() + this.ttlToMs(refreshTtl));

    const record = await this.authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: 'pending',
      expiresAt,
    });

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: record.id,
    };
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });

    await this.authRepo.updateRefreshTokenHash(
      record.id,
      this.hashToken(refreshToken),
    );

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt: expiresAt,
      user: this.toUserView(user),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private ttlToMs(ttl: string): number {
    const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
    if (!match) {
      const asNumber = Number(ttl);
      if (!Number.isNaN(asNumber)) {
        return asNumber * 1000;
      }
      return 7 * 24 * 60 * 60 * 1000;
    }
    const value = Number(match[1]);
    const unit = match[2];
    const unitMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * unitMs[unit];
  }

  private toUserView(user: any): AuthUserView {
    const permissions = new Set<string>();
    if (user.roles) {
      for (const ur of user.roles) {
        if (ur.role?.permissions) {
          for (const rp of ur.role.permissions) {
            if (rp.permission?.action) {
              permissions.add(rp.permission.action);
            }
          }
        }
      }
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roles: user.roles
        ? user.roles.map((ur: any) => ur.role?.name || ur.role)
        : [],
      permissions: [...permissions],
      tenantId: user.tenantId ?? null,
    };
  }
}
