// src/modules/deals/dto/move-deal.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MoveDealDto {
  @ApiProperty()
  @IsUUID('4')
  toStageId: string;

  // Taşınan kartın ÜSTÜNDE kalacak kart (yoksa sütun başı).
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  beforeDealId?: string;

  // Taşınan kartın ALTINDA kalacak kart (yoksa sütun sonu).
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  afterDealId?: string;
}
