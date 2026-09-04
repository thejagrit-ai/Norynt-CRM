// src/modules/deals/dto/query-deal.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum DealStatusFilter {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}

export class QueryDealDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  pipelineId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  stageId?: string;

  @ApiPropertyOptional({ enum: DealStatusFilter })
  @IsOptional()
  @IsEnum(DealStatusFilter)
  status?: DealStatusFilter;

  // Arama: title/company/contactName (Prisma parametrik → injection yok).
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
