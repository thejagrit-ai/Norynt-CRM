// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpService } from './otp.service';
import { AuthMailService } from './mail/auth-mail.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    // Sırlar imzalama anında açıkça verilir (access/refresh farklı sır) — burada boş.
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, OtpService, AuthMailService],
  exports: [AuthService],
})
export class AuthModule {}
