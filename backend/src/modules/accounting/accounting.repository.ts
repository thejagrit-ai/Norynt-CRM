// src/modules/accounting/accounting.repository.ts
// VERİ ERİŞİMİ: Prisma çağrıları YALNIZCA burada (AccountingSync + fatura okuma).
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findInvoice(id: string) {
    return this.prisma.invoice.findFirst({
      where: { id },
      include: { lineItems: true },
    });
  }

  findSync(invoiceId: string) {
    return this.prisma.accountingSync.findUnique({ where: { invoiceId } });
  }

  upsertSync(
    invoiceId: string,
    data: {
      provider: string;
      externalId?: string | null;
      status: string;
      error?: string | null;
    },
  ) {
    return this.prisma.accountingSync.upsert({
      where: { invoiceId },
      create: { invoiceId, ...data, attempts: 1 },
      update: { ...data, attempts: { increment: 1 } },
    });
  }
}
