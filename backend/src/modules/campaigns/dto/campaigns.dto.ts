// src/modules/campaigns/dto/campaigns.dto.ts
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CampaignStatus, TemplateChannel } from '@prisma/client';

export class CreateEmailCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsString()
  @IsNotEmpty()
  fromName: string;

  @IsString()
  @IsNotEmpty()
  fromEmail: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsOptional()
  segmentId?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class UpdateEmailCampaignDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsOptional()
  segmentId?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class CreateSmsCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  segmentId?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TemplateChannel)
  @IsOptional()
  channel?: TemplateChannel;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  variables?: any;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(TemplateChannel)
  @IsOptional()
  channel?: TemplateChannel;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  variables?: any;
}

export class CreateWarmupProfileDto {
  @IsString()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsOptional()
  dailyLimit?: number;
}

export class CreateFunnelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  stages?: Array<{
    name: string;
    order: number;
    visitors?: number;
    conversions?: number;
  }>;
}
