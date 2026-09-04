// src/modules/approvals/approvals.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import { ApprovalsRepository } from './approvals.repository';
import {
  DecideApprovalDto,
  ApprovalDecision,
  CreateApprovalDto,
} from './dto/approval.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TasksService } from '../tasks/tasks.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { MailService } from '../integrations/mail/mail.service';
import { CreateTaskDto } from '../tasks/dto/task.dto';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly repo: ApprovalsRepository,
    private readonly tasks: TasksService,
    private readonly whatsapp: WhatsAppService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateApprovalDto, user: AuthenticatedUser) {
    const tenantId = user.tenantId ?? undefined;
    return this.repo.create(dto, tenantId, user.id);
  }

  async list(user: AuthenticatedUser, status?: ApprovalStatus) {
    const tenantId = user.tenantId ?? undefined;
    return this.repo.findMany(tenantId, status);
  }

  async getById(id: string, user: AuthenticatedUser) {
    const tenantId = user.tenantId ?? undefined;
    const item = await this.repo.findById(id, tenantId);
    if (!item) {
      throw new NotFoundException(
        `Approval request #${id} not found in this tenant.`,
      );
    }
    return item;
  }

  async decide(id: string, dto: DecideApprovalDto, user: AuthenticatedUser) {
    const tenantId = user.tenantId ?? undefined;
    const approval = await this.repo.findById(id, tenantId);

    if (!approval) {
      throw new NotFoundException(
        `Approval request #${id} not found in this tenant.`,
      );
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot decide on approval #${id} because it is already ${approval.status}.`,
      );
    }

    if (dto.decision === ApprovalDecision.REJECT) {
      this.logger.log(
        `Approval #${id} rejected by user ${user.id} (${user.email})`,
      );
      return this.repo.updateStatus(id, ApprovalStatus.REJECTED, user.id, {
        rejectedReason: dto.note ?? 'Rejected by manager',
        decidedBy: user.email,
        timestamp: new Date(),
      });
    }

    // Execute approved action with full re-validation
    let executionResult: unknown = null;
    const payload = (approval.payload as Record<string, unknown>) ?? {};

    try {
      switch (approval.actionType) {
        case 'create_task':
        case 'task.create': {
          executionResult = await this.tasks.create(
            payload as unknown as CreateTaskDto,
            user,
          );
          break;
        }
        case 'send_whatsapp':
        case 'send_external_communication': {
          const toStr = String(payload.to || payload.recipient || '');
          const bodyStr = String(payload.body || '');
          const leadIdStr = payload.leadId ? String(payload.leadId) : undefined;
          if (
            payload.channel === 'WHATSAPP' ||
            approval.actionType === 'send_whatsapp'
          ) {
            executionResult = await this.whatsapp.send({
              to: toStr,
              body: bodyStr,
              leadId: leadIdStr,
            });
          } else if (payload.channel === 'EMAIL') {
            await this.mail.send({
              to: toStr,
              subject: String(payload.subject || 'CRM Notification'),
              template: 'generic',
              context: { body: bodyStr },
            });
            executionResult = {
              sent: true,
              recipient: toStr,
            };
          }
          break;
        }
        default:
          executionResult = {
            executed: true,
            note: 'Approved and marked executed by manager',
          };
      }

      this.logger.log(
        `Approval #${id} APPROVED and executed by user ${user.id}`,
      );
      return this.repo.updateStatus(
        id,
        ApprovalStatus.APPROVED,
        user.id,
        executionResult,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to execute approved action for #${id}: ${msg}`);
      throw new BadRequestException(`Execution failed: ${msg}`);
    }
  }
}
