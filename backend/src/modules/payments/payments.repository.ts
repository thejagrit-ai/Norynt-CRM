// src/modules/payments/payments.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createIntent(data: {
    invoiceId: string;
    token: string;
    conversationId: string;
    amount: Prisma.Decimal | string;
    currency: string;
    provider: string;
    metadata?: any;
    createdById: string;
    tenantId?: string | null;
  }) {
    return this.prisma.paymentIntent.create({ data });
  }

  findByToken(token: string) {
    return this.prisma.paymentIntent.findUnique({
      where: { token },
      include: { invoice: true },
    });
  }

  findByConversationId(conversationId: string) {
    return this.prisma.paymentIntent.findUnique({
      where: { conversationId },
      include: { invoice: true },
    });
  }

  listByInvoice(invoiceId: string) {
    return this.prisma.paymentIntent.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async claimPaid(token: string, providerRef: string | null): Promise<boolean> {
    const r = await this.prisma.paymentIntent.updateMany({
      where: { token, status: 'pending' },
      data: { status: 'paid', providerRef },
    });
    return r.count === 1;
  }

  async markFailed(token: string, providerRef: string | null): Promise<void> {
    await this.prisma.paymentIntent.updateMany({
      where: { token, status: 'pending' },
      data: { status: 'failed', providerRef },
    });
  }

  async listAllTransactions(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 25;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentIntentWhereInput = {};
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.paymentIntent.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              customerName: true,
              customerEmail: true,
              total: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentIntent.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async isWebhookProcessed(key: string): Promise<boolean> {
    const existing = await this.prisma.processedWebhook.findUnique({
      where: { key },
    });
    return Boolean(existing);
  }

  async recordProcessedWebhook(key: string, source: string) {
    return this.prisma.processedWebhook.create({
      data: { key, source },
    });
  }
}
