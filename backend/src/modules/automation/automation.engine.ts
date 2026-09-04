// src/modules/automation/automation.engine.ts
// Domain event listener → matches active automation rules and executes actions safely.
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TaskPriority } from '@prisma/client';
import { AutomationRepository } from './automation.repository';
import { MailService } from '../integrations/mail/mail.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { TasksService } from '../tasks/tasks.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

type Payload = Record<string, unknown>;
interface Condition {
  field: string;
  equals: string;
}
interface Action {
  type: string;
  note?: string;
  template?: string;
  to?: string;
  priority?: string;
  title?: string;
  reason?: string;
  riskLevel?: string;
}

export function evaluateConditions(
  conditions: Condition | null | undefined,
  payload: Payload,
): boolean {
  if (!conditions || !conditions.field) return true;
  return String(payload[conditions.field]) === String(conditions.equals);
}

export function interpolate(templateText: string, payload: Payload): string {
  return templateText.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    payload[key] === undefined || payload[key] === null
      ? ''
      : String(payload[key]),
  );
}

@Injectable()
export class AutomationEngine {
  private readonly logger = new Logger(AutomationEngine.name);

  constructor(
    private readonly repo: AutomationRepository,
    private readonly mail: MailService,
    private readonly whatsapp: WhatsAppService,
    private readonly tasks: TasksService,
    private readonly approvals: ApprovalsService,
  ) {}

  @OnEvent('deal.created')
  onDealCreated(p: Payload) {
    return this.run('deal.created', p);
  }
  @OnEvent('deal.moved')
  onDealMoved(p: Payload) {
    return this.run('deal.moved', p);
  }
  @OnEvent('lead.created')
  onLeadCreated(p: Payload) {
    return this.run('lead.created', p);
  }
  @OnEvent('invoice.paid')
  onInvoicePaid(p: Payload) {
    return this.run('invoice.paid', p);
  }
  @OnEvent('invoice.issued')
  onInvoiceIssued(p: Payload) {
    return this.run('invoice.issued', p);
  }
  @OnEvent('task.created')
  onTaskCreated(p: Payload) {
    return this.run('task.created', p);
  }
  @OnEvent('ticket.created')
  onTicketCreated(p: Payload) {
    return this.run('ticket.created', p);
  }
  @OnEvent('payment.received')
  onPaymentReceived(p: Payload) {
    return this.run('payment.received', p);
  }

  async run(trigger: string, payload: Payload): Promise<void> {
    const rules = await this.repo.findActiveByTrigger(trigger);
    for (const rule of rules) {
      const conditions = rule.conditions as unknown as Condition | null;
      if (!evaluateConditions(conditions, payload)) continue;
      const actions = (rule.actions as unknown as Action[]) ?? [];
      for (const action of actions) {
        await this.execute(action, payload).catch((err) =>
          this.logger.warn(
            `Rule #${rule.id} action ${action.type} error: ${
              err instanceof Error ? err.message : err
            }`,
          ),
        );
      }
    }
  }

  private async execute(action: Action, payload: Payload): Promise<void> {
    switch (action.type) {
      case 'create_activity': {
        const dealId = payload.dealId as string | undefined;
        if (dealId) {
          await this.repo.createDealActivity(
            dealId,
            'automation',
            action.note ?? 'Automation activity log',
          );
        }
        return;
      }
      case 'create_task': {
        const title = action.title
          ? interpolate(action.title, payload)
          : `Follow up on ${payload.title || payload.subject || 'record'}`;
        const actor: AuthenticatedUser = {
          id: (payload.userId as string) || 'system-automation',
          email: 'automation@crm.internal',
          roles: ['SYSTEM'],
          tenantId: payload.tenantId as string | undefined,
          permissions: ['*'],
        };
        await this.tasks.create(
          {
            title,
            priority: (action.priority as TaskPriority) || TaskPriority.MEDIUM,
            dealId: payload.dealId as string | undefined,
            leadId: payload.leadId as string | undefined,
            contactId: payload.contactId as string | undefined,
            companyId: payload.companyId as string | undefined,
          },
          actor,
        );
        return;
      }
      case 'request_approval': {
        const actor: AuthenticatedUser = {
          id: (payload.userId as string) || 'system-automation',
          email: 'automation@crm.internal',
          roles: ['SYSTEM'],
          tenantId: payload.tenantId as string | undefined,
          permissions: ['*'],
        };
        await this.approvals.create(
          {
            agentName: 'WorkflowEngine',
            actionType: action.note || 'high_risk_workflow_action',
            payload,
            reason:
              action.reason ||
              'Automation rule flagged action for human manager review.',
            riskLevel: action.riskLevel || 'HIGH',
          },
          actor,
        );
        return;
      }
      case 'send_email': {
        if (action.to && action.template) {
          await this.mail.sendTemplate(action.to, action.template, payload);
        }
        return;
      }
      case 'send_whatsapp': {
        const to = action.to || (payload.phone as string | undefined);
        if (to && action.note) {
          await this.whatsapp.send({
            to,
            body: interpolate(action.note, payload),
            leadId: (payload.leadId as string | undefined) ?? null,
          });
        }
        return;
      }
      case 'log':
      default:
        this.logger.log(
          `automation: ${action.note ?? action.type} ${JSON.stringify(payload)}`,
        );
        return;
    }
  }
}
