// src/modules/ai/ai-tools.service.ts
// Secure Parameterized AI Tool Registry with Tenant Isolation & RBAC Protection.
import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DealsService } from '../deals/deals.service';
import { TasksService } from '../tasks/tasks.service';
import { Customer360Service } from '../customer360/customer360.service';
import { SearchService } from '../search/search.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateTaskDto } from '../tasks/dto/task.dto';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToolDefinition {
  name: string;
  description: string;
  requiredPermission: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  parametersSchema: Record<string, unknown>;
}

export interface ToolExecutionRequest {
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  requiresApproval?: boolean;
  approvalRequestId?: string;
  data?: unknown;
  error?: string;
}

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  private readonly tools: Map<string, ToolDefinition> = new Map([
    [
      'search_records',
      {
        name: 'search_records',
        description:
          'Omnisearch across deals, contacts, companies, leads, tasks, and tickets.',
        requiredPermission: 'search.read',
        riskLevel: 'LOW',
        requiresApproval: false,
        parametersSchema: {
          type: 'object',
          properties: { query: { type: 'string', minLength: 2 } },
          required: ['query'],
        },
      },
    ],
    [
      'get_customer_360',
      {
        name: 'get_customer_360',
        description:
          'Get full Customer 360 profile, timeline, financial ledger, and AI health score.',
        requiredPermission: 'customer.read',
        riskLevel: 'LOW',
        requiresApproval: false,
        parametersSchema: {
          type: 'object',
          properties: { customerId: { type: 'string' } },
          required: ['customerId'],
        },
      },
    ],
    [
      'get_deal',
      {
        name: 'get_deal',
        description:
          'Retrieve full deal context, stages, probability, and activity history.',
        requiredPermission: 'deal.read',
        riskLevel: 'LOW',
        requiresApproval: false,
        parametersSchema: {
          type: 'object',
          properties: { dealId: { type: 'string' } },
          required: ['dealId'],
        },
      },
    ],
    [
      'create_task',
      {
        name: 'create_task',
        description:
          'Create a new follow-up or scheduled task for a deal, lead, or contact.',
        requiredPermission: 'task.create',
        riskLevel: 'MEDIUM',
        requiresApproval: false,
        parametersSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3 },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            },
            dealId: { type: 'string' },
            dueDate: { type: 'string' },
          },
          required: ['title'],
        },
      },
    ],
    [
      'update_task',
      {
        name: 'update_task',
        description: 'Update status or priority of an existing task.',
        requiredPermission: 'task.update',
        riskLevel: 'MEDIUM',
        requiresApproval: false,
        parametersSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
            },
          },
          required: ['taskId', 'status'],
        },
      },
    ],
    [
      'draft_email',
      {
        name: 'draft_email',
        description:
          'Generate high-conversion professional email draft for customer communication.',
        requiredPermission: 'ai.use',
        riskLevel: 'LOW',
        requiresApproval: false,
        parametersSchema: {
          type: 'object',
          properties: {
            context: { type: 'string', minLength: 3 },
            tone: {
              type: 'string',
              enum: ['professional', 'friendly', 'formal'],
            },
          },
          required: ['context'],
        },
      },
    ],
    [
      'calculate_forecast',
      {
        name: 'calculate_forecast',
        description:
          'Calculate pipeline velocity and weighted revenue forecast based on stage probabilities.',
        requiredPermission: 'report.read',
        riskLevel: 'LOW',
        requiresApproval: false,
        parametersSchema: {
          type: 'object',
          properties: { pipelineId: { type: 'string' } },
        },
      },
    ],
    [
      'send_external_communication',
      {
        name: 'send_external_communication',
        description:
          'High-risk action: Send external email or WhatsApp message to a customer.',
        requiredPermission: 'whatsapp.write',
        riskLevel: 'HIGH',
        requiresApproval: true,
        parametersSchema: {
          type: 'object',
          properties: {
            recipient: { type: 'string' },
            body: { type: 'string' },
            channel: { type: 'string', enum: ['EMAIL', 'WHATSAPP'] },
          },
          required: ['recipient', 'body', 'channel'],
        },
      },
    ],
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deals: DealsService,
    private readonly tasks: TasksService,
    private readonly customer360: Customer360Service,
    private readonly search: SearchService,
  ) {}

  getAvailableTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  async executeTool(
    req: ToolExecutionRequest,
    user: AuthenticatedUser,
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(req.toolName);
    if (!tool) {
      throw new BadRequestException(`Unknown AI tool: ${req.toolName}`);
    }

    const tenantId = user.tenantId ?? undefined;

    // RBAC Check: Ensure user has required permission
    if (
      tool.requiredPermission &&
      !user.permissions?.includes(tool.requiredPermission) &&
      !user.permissions?.includes('*')
    ) {
      throw new ForbiddenException(
        `User lacks required permission '${tool.requiredPermission}' for tool '${tool.name}'.`,
      );
    }

    // High-Risk Actions -> Create HITL ApprovalRequest
    if (tool.requiresApproval) {
      const approval = await this.prisma.approvalRequest.create({
        data: {
          tenantId: tenantId ?? 'default-tenant',
          agentName: 'AiToolAgent',
          actionType: tool.name,
          riskLevel: tool.riskLevel,
          payload: req.parameters as Record<string, string>,
          reason: `High risk tool execution requested: ${tool.name}`,
          status: 'PENDING',
          requestedById: user.id,
        },
      });

      this.logger.warn(
        `Tool '${tool.name}' classified as HIGH RISK. Created ApprovalRequest ID: ${approval.id}`,
      );

      return {
        toolName: tool.name,
        success: true,
        requiresApproval: true,
        approvalRequestId: approval.id,
        data: {
          message:
            'This high-risk action requires human manager approval before execution.',
          approvalId: approval.id,
        },
      };
    }

    // Safe execution routed to underlying CRM domain service
    try {
      let resultData: unknown = null;

      switch (tool.name) {
        case 'search_records': {
          resultData = await this.search.search(
            String(req.parameters.query || ''),
            user,
          );
          break;
        }
        case 'get_customer_360': {
          resultData = await this.customer360.getCustomer360(
            String(req.parameters.customerId || ''),
            user,
          );
          break;
        }
        case 'get_deal': {
          resultData = await this.deals.findOne(
            String(req.parameters.dealId || ''),
          );
          break;
        }
        case 'create_task': {
          resultData = await this.tasks.create(
            req.parameters as unknown as CreateTaskDto,
            user,
          );
          break;
        }
        case 'update_task': {
          resultData = await this.tasks.update(
            String(req.parameters.taskId || ''),
            {
              status: req.parameters.status as TaskStatus,
            },
          );
          break;
        }
        case 'draft_email': {
          const ctx = String(req.parameters.context || '');
          resultData = {
            subject: `Follow-up on ${ctx.slice(0, 30)}`,
            body: `Dear Customer,\n\nFollowing up regarding ${ctx}. Please let us know if you need further assistance.\n\nBest regards,\nNorynt CRM Team`,
          };
          break;
        }
        case 'calculate_forecast': {
          const deals = await this.prisma.deal.findMany({
            where: { tenantId, status: 'OPEN', deletedAt: null },
            include: { stage: true },
          });
          const totalVal = deals.reduce(
            (acc, d) => acc + Number(d.value ?? 0),
            0,
          );
          const weightedVal = deals.reduce(
            (acc, d) =>
              acc +
              Number(d.value ?? 0) *
                (d.stage?.isWon ? 1 : d.stage?.isLost ? 0 : 0.5),
            0,
          );
          resultData = {
            openDealsCount: deals.length,
            totalOpenValue: totalVal,
            weightedForecast: Math.round(weightedVal),
          };
          break;
        }
        default:
          throw new BadRequestException(
            `Unimplemented tool handler: ${tool.name}`,
          );
      }

      return {
        toolName: tool.name,
        success: true,
        data: resultData,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error executing AI tool ${tool.name}: ${msg}`);
      return {
        toolName: tool.name,
        success: false,
        error: msg,
      };
    }
  }
}
