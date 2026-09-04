// src/modules/invoices/money.util.ts
// Sunucu tarafı parasal hesap — TÜMÜ Decimal (float YOK). Saf fonksiyonlar → test edilir.
import { Prisma } from '@prisma/client';
import { InvoiceStatus } from '@prisma/client';

const D = Prisma.Decimal;
type Decimal = Prisma.Decimal;

export interface LineInput {
  quantity: string;
  unitPrice: string;
}

export interface Totals {
  lineTotals: Decimal[];
  subtotal: Decimal;
  taxAmount: Decimal;
  total: Decimal;
}

// lineTotal = quantity * unitPrice (2 hane); subtotal = Σ lineTotal;
// taxAmount = round(subtotal * taxRate/100, 2); total = subtotal + taxAmount.
export function calcTotals(lines: LineInput[], taxRate: string): Totals {
  const lineTotals = lines.map((l) =>
    new D(l.quantity).mul(new D(l.unitPrice)).toDecimalPlaces(2),
  );
  const subtotal = lineTotals
    .reduce((acc, lt) => acc.plus(lt), new D(0))
    .toDecimalPlaces(2);
  const taxAmount = subtotal.mul(new D(taxRate)).div(100).toDecimalPlaces(2);
  const total = subtotal.plus(taxAmount).toDecimalPlaces(2);
  return { lineTotals, subtotal, taxAmount, total };
}

// amountPaid'e göre durum (yalnız issue edilmiş faturalarda anlamlı).
export function deriveStatus(
  amountPaid: Decimal,
  total: Decimal,
): InvoiceStatus {
  if (amountPaid.gte(total)) return InvoiceStatus.PAID;
  if (amountPaid.gt(0)) return InvoiceStatus.PARTIALLY_PAID;
  return InvoiceStatus.SENT;
}

export function invoiceNumber(year: number, seq: number): string {
  return `INV-${year}-${String(seq).padStart(6, '0')}`;
}
