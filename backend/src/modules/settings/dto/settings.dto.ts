// src/modules/settings/dto/settings.dto.ts
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planTier: string;

  @IsString()
  @IsOptional()
  billingCycle?: string;
}

export class CreateSlaPolicyDto {
  @IsString()
  @IsNotEmpty()
  priority: string; // LOW, MEDIUM, HIGH, URGENT

  @IsNumber()
  responseTimeHours: number;

  @IsNumber()
  resolutionTimeHours: number;

  @IsBoolean()
  @IsOptional()
  autoEscalate?: boolean;
}

export class CreateLeadMasterDto {
  @IsString()
  @IsNotEmpty()
  category: string; // LOSS_REASON, SOURCE, RATING, STATUS

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateAssignmentRuleDto {
  @IsString()
  @IsNotEmpty()
  type: string; // LEAD, DEAL

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  strategy?: string; // ROUND_ROBIN, WEIGHTED, CONDITIONAL

  @IsOptional()
  conditions?: any;

  @IsOptional()
  assignedUserIds?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateChatbotConfigDto {
  @IsString()
  @IsOptional()
  botName?: string;

  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @IsString()
  @IsOptional()
  promptInstructions?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
