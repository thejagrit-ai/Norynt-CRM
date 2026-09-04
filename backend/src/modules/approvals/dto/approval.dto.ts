// src/modules/approvals/dto/approval.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ApprovalDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class DecideApprovalDto {
  @ApiProperty({
    enum: ApprovalDecision,
    description: 'Decision to approve or reject the request',
  })
  @IsEnum(ApprovalDecision)
  decision!: ApprovalDecision;

  @ApiPropertyOptional({
    description: 'Optional feedback or reason for the decision',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateApprovalDto {
  @ApiProperty({ description: 'Originating agent name' })
  @IsNotEmpty()
  @IsString()
  agentName!: string;

  @ApiProperty({ description: 'Action type e.g. send_email, update_deal' })
  @IsNotEmpty()
  @IsString()
  actionType!: string;

  @ApiProperty({ description: 'Action payload arguments' })
  @IsNotEmpty()
  payload!: Record<string, unknown>;

  @ApiProperty({ description: 'Reason for requiring approval' })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Risk level: LOW, MEDIUM, HIGH' })
  @IsOptional()
  @IsString()
  riskLevel?: string;
}
