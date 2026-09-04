// src/modules/invoices/money.util.spec.ts
import { InvoiceStatus, Prisma } from '@prisma/client';
import { calcTotals, deriveStatus, invoiceNumber } from './money.util';

const D = Prisma.Decimal;

describe('calcTotals', () => {
  // U-4.1
  it('subtotal/tax/total doğru hesaplar', () => {
    const t = calcTotals([{ quantity: '2', unitPrice: '1500.00' }], '20');
    expect(t.subtotal.toString()).toBe('3000');
    expect(t.taxAmount.toString()).toBe('600');
    expect(t.total.toString()).toBe('3600');
  });

  it('çok kalemli subtotal toplar', () => {
    const t = calcTotals(
      [
        { quantity: '3', unitPrice: '100.00' },
        { quantity: '1', unitPrice: '50.50' },
      ],
      '10',
    );
    expect(t.subtotal.toString()).toBe('350.5');
    expect(t.taxAmount.toString()).toBe('35.05');
    expect(t.total.toString()).toBe('385.55');
  });

  // U-4.7 — Decimal hassasiyeti (float 0.1+0.2 hatası YOK)
  it('0.1 + 0.2 hassasiyeti korunur', () => {
    const t = calcTotals(
      [
        { quantity: '1', unitPrice: '0.10' },
        { quantity: '1', unitPrice: '0.20' },
      ],
      '0',
    );
    expect(t.subtotal.toString()).toBe('0.3'); // 0.30000000000000004 DEĞİL
    expect(t.total.toString()).toBe('0.3');
  });
});

describe('deriveStatus', () => {
  // U-4.2
  it('tam ödeme → PAID', () => {
    expect(deriveStatus(new D('100'), new D('100'))).toBe(InvoiceStatus.PAID);
  });
  it('kısmi ödeme → PARTIALLY_PAID', () => {
    expect(deriveStatus(new D('40'), new D('100'))).toBe(
      InvoiceStatus.PARTIALLY_PAID,
    );
  });
  it('ödeme yok → SENT', () => {
    expect(deriveStatus(new D('0'), new D('100'))).toBe(InvoiceStatus.SENT);
  });
});

describe('invoiceNumber', () => {
  // U-4.6 — formatlı, atlamasız
  it('INV-YYYY-000NNN formatı', () => {
    expect(invoiceNumber(2026, 123)).toBe('INV-2026-000123');
    expect(invoiceNumber(2026, 1)).toBe('INV-2026-000001');
  });
});
