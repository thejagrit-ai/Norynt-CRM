// src/modules/masters/dto/masters.dto.ts
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaxSlabDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  rate: number;

  @IsNumber()
  @IsOptional()
  cgstRate?: number;

  @IsNumber()
  @IsOptional()
  sgstRate?: number;

  @IsNumber()
  @IsOptional()
  igstRate?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateUomDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsNumber()
  @IsOptional()
  precision?: number;
}

export class CreateTncSetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
