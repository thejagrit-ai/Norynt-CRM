// src/modules/auth/auth.controller.ts
// SADECE HTTP: DTO alır, servisi çağırır, refresh cookie set/clear eder. İş mantığı YOK.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService, LoginResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailOnlyDto, ResetPasswordDto, VerifyEmailDto } from './dto/otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Patch } from '@nestjs/common';

const REFRESH_COOKIE = 'refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Confirm signup with the emailed 6-digit code' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.otp);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Email a new signup verification code' })
  resendVerification(@Body() dto: EmailOnlyDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Email a password reset code (always returns 200)' })
  forgotPassword(@Body() dto: EmailOnlyDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set a new password using the emailed code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @ApiOperation({ summary: 'Giriş — access token + httpOnly refresh cookie' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.validateAndLogin(dto);
    this.setRefreshCookie(res, result);
    return this.toLoginResponse(result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh cookie ile access token yenileme (rotasyon)',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      // Public ama cookie yoksa 401 — UnauthorizedException servis tarafında atılır.
      const result = await this.authService.refresh('');
      this.setRefreshCookie(res, result);
      return this.toLoginResponse(result);
    }
    const result = await this.authService.refresh(token);
    this.setRefreshCookie(res, result);
    return this.toLoginResponse(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Çıkış — refresh token iptali + cookie temizleme' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.authService.logout(token);
    this.clearRefreshCookie(res);
    return { loggedOut: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Mevcut kullanıcı profili' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Kendi profilini güncelle' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kendi şifreni değiştir' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // --- Cookie yardımcıları ---

  private setRefreshCookie(res: Response, result: LoginResult): void {
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE', false),
      sameSite: 'strict',
      expires: result.refreshExpiresAt,
      path: '/api/v1/auth',
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE', false),
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }

  // Ham refresh token yanıt gövdesinde DÖNDÜRÜLMEZ (yalnız httpOnly cookie'de).
  private toLoginResponse(result: LoginResult) {
    return { accessToken: result.accessToken, user: result.user };
  }
}
