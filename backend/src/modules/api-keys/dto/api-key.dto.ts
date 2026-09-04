// src/modules/api-keys/dto/api-key.dto.ts
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Descriptive name for the API key',
    example: 'Zapier Integration',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Allowed permission scopes for this key',
    example: ['deal.read', 'lead.create', 'contact.read'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({
    description: 'Optional expiration timestamp in ISO format',
  })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export interface ApiKeyCreatedResponse {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: Date;
  expiresAt?: Date | null;
  rawKey: string; // ONLY RETURNED ONCE UPON CREATION
}
