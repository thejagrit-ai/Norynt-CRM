// src/modules/approvals/approvals.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalRequest, ApprovalStatus, Prisma } from '@prisma/client';
import { CreateApprovalDto } from './dto/approval.dto';

@Injectable()
export class ApprovalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateApprovalDto,
    tenantId?: string,
    requestedById?: string,
  ): Promise<ApprovalRequest> {
    return this.prisma.approvalRequest.create({
      data: {
        tenantId,
        agentName: dto.agentName,
        actionType: dto.actionType,
        payload: dto.payload as Prisma.InputJsonObject,
        reason: dto.reason,
        riskLevel: dto.riskLevel ?? 'MEDIUM',
        status: ApprovalStatus.PENDING,
        requestedById,
      },
    });
  }

  async findMany(
    tenantId?: string,
    status?: ApprovalStatus,
  ): Promise<ApprovalRequest[]> {
    return this.prisma.approvalRequest.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        reviewedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findById(
    id: string,
    tenantId?: string,
  ): Promise<ApprovalRequest | null> {
    return this.prisma.approvalRequest.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        reviewedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: ApprovalStatus,
    reviewedById: string,
    executionResult?: unknown,
  ): Promise<ApprovalRequest> {
    return this.prisma.approvalRequest.update({
      where: { id },
      data: {
        status,
        reviewedById,
        reviewedAt: new Date(),
        executionResult: (executionResult ??
          Prisma.DbNull) as Prisma.InputJsonValue,
      },
    });
  }
}
