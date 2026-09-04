// src/test/tenant-isolation.spec.ts
// Automated Multi-Tenant Safety & Data Isolation Test Suite
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../modules/search/search.service';
import { TasksService } from '../modules/tasks/tasks.service';
import { TasksRepository } from '../modules/tasks/tasks.repository';
import { TicketsService } from '../modules/tickets/tickets.service';
import { TicketsRepository } from '../modules/tickets/tickets.repository';
import { Customer360Service } from '../modules/customer360/customer360.service';
import { ApprovalsService } from '../modules/approvals/approvals.service';
import { ApprovalsRepository } from '../modules/approvals/approvals.repository';
import { ApiKeysService } from '../modules/api-keys/api-keys.service';
import { ApiKeysRepository } from '../modules/api-keys/api-keys.repository';
import { AiToolsService } from '../modules/ai/ai-tools.service';
import { DealsService } from '../modules/deals/deals.service';
import { WhatsAppService } from '../modules/whatsapp/whatsapp.service';
import { MailService } from '../modules/integrations/mail/mail.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ApprovalDecision } from '../modules/approvals/dto/approval.dto';

describe('Multi-Tenant Safety & Data Isolation Test Suite', () => {
  const allPermissions = [
    'deal.read',
    'contact.read',
    'company.read',
    'task.read',
    'task.create',
    'task.update',
    'task.delete',
    'ticket.read',
    'ticket.create',
    'ticket.update',
    'ticket.delete',
    'lead.read',
    'customer_360.read',
    'approval.read',
    'approval.manage',
    'integration.read',
    'integration.manage',
    'ai.use',
    'whatsapp.write',
  ];

  const tenantA: AuthenticatedUser = {
    id: 'user-tenant-a',
    email: 'alice@tenant-a.com',
    roles: ['ADMIN'],
    tenantId: 'tenant-a-uuid',
    permissions: allPermissions,
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let prismaMock: Record<string, any>;
  let searchService: SearchService;
  let tasksService: TasksService;
  let ticketsService: TicketsService;
  let customer360Service: Customer360Service;
  let approvalsService: ApprovalsService;
  let apiKeysService: ApiKeysService;
  let aiToolsService: AiToolsService;

  beforeEach(async () => {
    prismaMock = {
      deal: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      contact: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      company: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      lead: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      task: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      ticket: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      ticketCounter: {
        upsert: jest.fn().mockResolvedValue({ year: 2026, lastNumber: 1 }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      approvalRequest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      apiKey: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        SearchService,
        TasksService,
        TasksRepository,
        TicketsService,
        TicketsRepository,
        Customer360Service,
        ApprovalsService,
        ApprovalsRepository,
        ApiKeysService,
        ApiKeysRepository,
        AiToolsService,
        {
          provide: DealsService,
          useValue: {
            findOne: jest.fn(),
            list: jest.fn(),
          },
        },
        {
          provide: WhatsAppService,
          useValue: { send: jest.fn().mockResolvedValue({ id: 'msg-1' }) },
        },
        {
          provide: MailService,
          useValue: { send: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    searchService = module.get<SearchService>(SearchService);
    tasksService = module.get<TasksService>(TasksService);
    ticketsService = module.get<TicketsService>(TicketsService);
    customer360Service = module.get<Customer360Service>(Customer360Service);
    approvalsService = module.get<ApprovalsService>(ApprovalsService);
    apiKeysService = module.get<ApiKeysService>(ApiKeysService);
    aiToolsService = module.get<AiToolsService>(AiToolsService);
  });

  describe('1. Global Search Isolation', () => {
    it('should filter all entity queries strictly by caller tenantId', async () => {
      await searchService.search('Acme', tenantA);

      expect(prismaMock.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-a-uuid' }),
        }),
      );
      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-a-uuid' }),
        }),
      );
    });
  });

  describe('2. Task Management Isolation', () => {
    it('should prevent updating a non-existent or inaccessible task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(
        tasksService.update('task-of-tenant-b', { status: 'DONE' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent deleting a non-existent or inaccessible task', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      await expect(tasksService.remove('task-of-tenant-b')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('3. Helpdesk Tickets Isolation', () => {
    it('should prevent accessing a non-existent or inaccessible ticket', async () => {
      prismaMock.ticket.findUnique.mockResolvedValue(null);

      await expect(ticketsService.findOne('ticket-b-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('4. Customer 360 Isolation', () => {
    it('should return 404 when Tenant A tries to aggregate Customer 360 for Tenant B company', async () => {
      prismaMock.company.findFirst.mockResolvedValue(null);
      prismaMock.contact.findFirst.mockResolvedValue(null);

      await expect(
        customer360Service.getCustomer360('company-tenant-b-id', tenantA),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. Approvals (HITL) Isolation', () => {
    it('should prevent Tenant A from approving an ApprovalRequest belonging to Tenant B', async () => {
      prismaMock.approvalRequest.findFirst.mockResolvedValue(null);

      await expect(
        approvalsService.decide(
          'approval-b-id',
          { decision: ApprovalDecision.APPROVE },
          tenantA,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('6. Developer Scoped API Keys Isolation', () => {
    it('should store and query API keys strictly within the owner tenant', async () => {
      prismaMock.apiKey.findMany.mockResolvedValue([]);

      await apiKeysService.list(tenantA);

      expect(prismaMock.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-a-uuid' },
        }),
      );
    });
  });

  describe('7. AI Tools Sandbox Execution', () => {
    it('should reject tool execution if the user lacks the required permission scope', async () => {
      const restrictedUser: AuthenticatedUser = {
        id: 'user-restricted',
        email: 'intern@tenant-a.com',
        roles: ['INTERN'],
        tenantId: 'tenant-a-uuid',
        permissions: ['read_only'],
      };

      await expect(
        aiToolsService.executeTool(
          {
            toolName: 'create_task',
            parameters: { title: 'Unauthorized Task' },
          },
          restrictedUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should route high-risk tool actions to ApprovalRequest instead of direct execution', async () => {
      prismaMock.approvalRequest.create.mockResolvedValue({
        id: 'approval-req-123',
        status: 'PENDING',
      });

      const result = await aiToolsService.executeTool(
        {
          toolName: 'send_external_communication',
          parameters: {
            recipient: '+905551234567',
            body: 'Discount proposal',
            channel: 'WHATSAPP',
          },
        },
        tenantA,
      );

      expect(result.requiresApproval).toBe(true);
      expect(result.approvalRequestId).toBe('approval-req-123');
      expect(prismaMock.approvalRequest.create).toHaveBeenCalled();
    });
  });
});
