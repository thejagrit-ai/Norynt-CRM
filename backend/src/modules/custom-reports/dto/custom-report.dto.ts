// src/modules/custom-reports/dto/custom-report.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  entity: string; // DEAL, LEAD, INVOICE, TICKET, CONTACT

  @IsOptional()
  metrics?: any;

  @IsString()
  @IsOptional()
  groupBy?: string;

  @IsString()
  @IsOptional()
  dateRange?: string;

  @IsString()
  @IsOptional()
  chartType?: string;
}

export class ExecuteReportDto {
  @IsString()
  entity: string;

  @IsString()
  @IsOptional()
  groupBy?: string;

  @IsString()
  @IsOptional()
  dateRange?: string;
}
