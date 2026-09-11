// src/modules/whatsapp/dto/whatsapp.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendWhatsAppDto {
  @ApiProperty({ example: '+905551112233' })
  @IsString()
  @MinLength(7)
  @MaxLength(20)
  to: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contactId?: string;
}

export class CreateBroadcastDto {
  @IsString()
  name: string;

  @IsString()
  templateName: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsOptional()
  scheduledAt?: string;
}

export class CreateWhatsAppTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  headerType?: string;

  @IsString()
  @IsOptional()
  headerContent?: string;

  @IsString()
  bodyContent: string;

  @IsString()
  @IsOptional()
  footerContent?: string;

  @IsOptional()
  buttons?: any;
}

export class CreateQuickReplyDto {
  @IsString()
  shortcut: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsString()
  @IsOptional()
  category?: string;
}
