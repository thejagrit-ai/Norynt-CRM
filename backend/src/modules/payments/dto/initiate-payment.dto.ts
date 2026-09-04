// src/modules/payments/dto/initiate-payment.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class InitiatePaymentDto {
  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  buyerName?: string;

  @ApiPropertyOptional({ example: 'rahul@company.in' })
  @IsOptional()
  @IsEmail()
  buyerEmail?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  identityNumber?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'razorpay' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class PaymentSettingsDto {
  @IsString()
  defaultProvider: string; // razorpay | cashfree | payu | phonepe | stripe

  @IsString()
  defaultCurrency: string; // INR | USD | EUR | GBP

  @IsString()
  defaultCountry: string; // IN | US | etc

  @IsOptional()
  @IsString()
  mode?: 'test' | 'live';

  @IsOptional()
  credentials?: Record<string, string>;
}

export class RefundPaymentDto {
  @IsOptional()
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
