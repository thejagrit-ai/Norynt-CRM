// src/modules/ai/dto/ai.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const EMAIL_TONES = ['professional', 'friendly', 'formal'] as const;

export class DraftEmailDto {
  @ApiProperty({ description: 'E-postanın bağlamı/amacı (serbest metin)' })
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  context: string;

  @ApiPropertyOptional({ enum: EMAIL_TONES, default: 'professional' })
  @IsOptional()
  @IsIn(EMAIL_TONES)
  tone?: (typeof EMAIL_TONES)[number];

  @ApiPropertyOptional({ description: 'Yanıt dili', default: 'tr' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;
}

export class SummarizeDto {
  @ApiProperty({ description: 'Özetlenecek metin' })
  @IsString()
  @MinLength(3)
  @MaxLength(20000)
  text: string;
}

export class QueryAiDto {
  @ApiProperty({ description: 'Doğal dil CRM sorusu' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;
}

export class TestAiKeyDto {
  @ApiProperty({ example: 'groq' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'gsk_...' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiPropertyOptional({ example: 'llama-3.3-70b-versatile' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class ChatAiDto {
  @ApiProperty({ example: 'How many deals are open?' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;

  @ApiPropertyOptional({ example: 'groq' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;
}

export class FetchModelsDto {
  @ApiProperty({ example: 'groq' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'gsk_...' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}
