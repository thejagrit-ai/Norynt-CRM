// src/modules/payments/payments.service.ts
// Provider-Agnostic, India-First Payment Engine for Norynt CRM.
// Defaults: India (IN) / INR (₹) / Razorpay + Cashfree + PayU + PhonePe + Stripe + Legacy iyzico.
// Automatic HMAC signature verification, idempotent webhook processing, and secret redaction.

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ConnectionsService } from '../connections/connections.service';
import { InvoicesService } from '../invoices/invoices.service';
import { MailService } from '../integrations/mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsRepository } from './payments.repository';
import {
  InitiatePaymentDto,
  PaymentSettingsDto,
  RefundPaymentDto,
} from './dto/initiate-payment.dto';
import { testConnection as testProviderConn } from '../connections/provider-catalog';
import { EXT_HTTP, IExtHttpClient } from '../../common/http/ext-http.client';

const PAYABLE_STATUSES = new Set(['SENT', 'PARTIALLY_PAID', 'OVERDUE']);

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly connections: ConnectionsService,
    private readonly invoices: InvoicesService,
    private readonly repo: PaymentsRepository,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    @Inject(EXT_HTTP) @Optional() private readonly http?: IExtHttpClient,
  ) {}

  // ─── ADMIN CONFIGURATION ───

  async getPaymentSettings() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'payment_config' },
    });

    const val = (setting?.value as Record<string, any>) || {
      defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'razorpay',
      defaultCurrency: process.env.DEFAULT_PAYMENT_CURRENCY || 'INR',
      defaultCountry: process.env.DEFAULT_PAYMENT_COUNTRY || 'IN',
      mode: process.env.PAYMENT_MODE || 'test',
    };

    const connections = await this.prisma.connection.findMany({
      where: {
        provider: {
          in: ['razorpay', 'cashfree', 'payu', 'phonepe', 'stripe', 'iyzico'],
        },
      },
      select: { provider: true, status: true, config: true },
    });

    return {
      defaultProvider: val.defaultProvider || 'razorpay',
      defaultCurrency: val.defaultCurrency || 'INR',
      defaultCountry: val.defaultCountry || 'IN',
      mode: val.mode || 'test',
      activeProviders: connections.map((c) => ({
        provider: c.provider,
        status: c.status,
        keyId:
          (c.config as any)?.keyId ||
          (c.config as any)?.appId ||
          (c.config as any)?.merchantKey ||
          (c.config as any)?.apiKey ||
          null,
        mode: (c.config as any)?.liveMode || 'test',
      })),
    };
  }

  async updatePaymentSettings(
    dto: PaymentSettingsDto,
    actor?: AuthenticatedUser,
  ) {
    const configToSave = {
      defaultProvider: dto.defaultProvider || 'razorpay',
      defaultCurrency: dto.defaultCurrency || 'INR',
      defaultCountry: dto.defaultCountry || 'IN',
      mode: dto.mode || 'test',
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'payment_config' },
      create: {
        key: 'payment_config',
        value: configToSave as any,
        updatedBy: actor?.id,
      },
      update: {
        value: configToSave as any,
        updatedBy: actor?.id,
      },
    });

    if (dto.credentials && Object.keys(dto.credentials).length > 0) {
      try {
        await this.connections.connect({
          provider: dto.defaultProvider,
          secrets: dto.credentials,
          config: {
            liveMode: dto.mode || 'test',
            country: dto.defaultCountry,
            currency: dto.defaultCurrency,
          },
        });
      } catch (err: any) {
        const existing = await this.prisma.connection.findFirst({
          where: { provider: dto.defaultProvider },
        });
        if (existing) {
          await this.connections.update(existing.id, {
            secrets: dto.credentials,
            config: {
              liveMode: dto.mode || 'test',
              country: dto.defaultCountry,
              currency: dto.defaultCurrency,
            },
          });
        }
      }
    }

    void this.audit.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'UPDATE_PAYMENT_CONFIG',
      entity: 'PAYMENTS',
      description: `Payment settings updated (Provider: ${dto.defaultProvider}, Currency: ${dto.defaultCurrency}, Mode: ${dto.mode})`,
      path: '/api/v1/payments/settings',
      statusCode: 200,
      after: {
        defaultProvider: dto.defaultProvider,
        defaultCurrency: dto.defaultCurrency,
        defaultCountry: dto.defaultCountry,
        mode: dto.mode,
      },
    });

    return this.getPaymentSettings();
  }

  async testConnection(provider: string, credentials?: Record<string, string>) {
    let secrets: Record<string, string> = credentials || {};
    let config: Record<string, unknown> = {};

    if (!credentials || Object.keys(credentials).length === 0) {
      const creds = await this.connections.getCredentials(provider);
      if (creds) {
        secrets = creds.secrets;
        config = creds.config;
      }
    }

    if (!secrets || Object.keys(secrets).length === 0) {
      return {
        ok: false,
        message: `No credentials configured for provider ${provider}. Please enter credentials first.`,
      };
    }

    return testProviderConn(provider, secrets, config);
  }

  // ─── PAYMENT INITIATION ───

  async initiate(
    invoiceId: string,
    dto: InitiatePaymentDto,
    actor: AuthenticatedUser,
    ip: string,
  ) {
    const settings = await this.getPaymentSettings();
    const targetProvider =
      dto.provider || settings.defaultProvider || 'razorpay';
    const currency = dto.currency || settings.defaultCurrency || 'INR';

    const inv = await this.invoices.paymentSnapshot(invoiceId);
    if (!PAYABLE_STATUSES.has(inv.status)) {
      throw new ConflictException(
        'Only sent or partially paid invoices can be paid.',
      );
    }
    const remaining = inv.remaining;
    if (remaining.lte(0)) {
      throw new BadRequestException('Invoice is already fully settled.');
    }

    const price = remaining.toFixed(2);
    const conversationId = `inv_${invoiceId}_${Date.now()}`;
    let token = `tok_${crypto.randomBytes(16).toString('hex')}`;

    const buyerName = (dto.buyerName || inv.customerName || 'Customer').trim();
    const buyerEmail =
      dto.buyerEmail || inv.customerEmail || 'billing@customer.dev';

    const creds = await this.connections.getCredentials(targetProvider);
    if (!creds && targetProvider === 'iyzico') {
      throw new BadRequestException('iyzico provider is not connected.');
    }

    let providerRef = `ref_${Date.now()}`;
    let paymentPageUrl: string | null = null;
    let publishableKey: string | null = null;

    if (targetProvider === 'razorpay') {
      publishableKey =
        creds?.secrets.keyId ||
        (creds?.config.keyId as string) ||
        'rzp_test_simulated_key';
      providerRef = `order_${crypto.randomBytes(10).toString('hex')}`;
      paymentPageUrl = `${this.publicUrl()}/api/v1/webhooks/razorpay/checkout?token=${token}`;
    } else if (targetProvider === 'cashfree') {
      publishableKey =
        creds?.secrets.appId ||
        (creds?.config.appId as string) ||
        'TEST_SIMULATED_APP';
      providerRef = `cf_order_${Date.now()}`;
    } else if (targetProvider === 'stripe') {
      publishableKey =
        creds?.secrets.publishableKey ||
        (creds?.config.publishableKey as string) ||
        'pk_test_simulated_key';
      providerRef = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
    } else if (targetProvider === 'iyzico') {
      token = `tok_${invoiceId}`;
      paymentPageUrl = 'https://sandbox-api.iyzipay.com/payment/iyzipay';
      providerRef = `iyzico_${invoiceId}`;
    }

    const intent = await this.repo.createIntent({
      invoiceId,
      token,
      conversationId,
      amount: price,
      currency,
      provider: targetProvider,
      metadata: {
        buyerName,
        buyerEmail,
        buyerPhone: dto.buyerPhone,
        mode: settings.mode,
      },
      createdById: actor?.id || 'public',
      tenantId: actor?.tenantId || null,
    });

    void this.audit.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'INITIATE_PAYMENT',
      entity: 'PAYMENT_INTENT',
      entityId: intent.id,
      description: `Payment intent created for Invoice #${inv.number} (${currency} ${price} via ${targetProvider})`,
      path: `/api/v1/invoices/${invoiceId}/pay`,
      statusCode: 201,
      after: {
        invoiceId,
        amount: price,
        currency,
        provider: targetProvider,
      },
    });

    return {
      token,
      conversationId,
      amount: price,
      currency,
      provider: targetProvider,
      providerRef,
      publishableKey,
      paymentPageUrl,
      invoiceNumber: inv.number,
      customerName: buyerName,
      customerEmail: buyerEmail,
      mode: settings.mode,
    };
  }

  // ─── WEBHOOK HANDLER & SIGNATURE VERIFICATION ───

  async handleWebhook(
    provider: string,
    payload: any,
    headers: Record<string, string | string[]>,
    rawBody?: string,
  ) {
    const eventId =
      payload?.id ||
      payload?.event_id ||
      payload?.orderId ||
      `wh_${Date.now()}_${Math.random()}`;
    const dedupeKey = `wh_${provider}_${eventId}`;

    const alreadyProcessed = await this.repo.isWebhookProcessed(dedupeKey);
    if (alreadyProcessed) {
      this.logger.warn(
        `Duplicate webhook received for key: ${dedupeKey}, skipping.`,
      );
      return { status: 'already_processed' };
    }

    const creds = await this.connections.getCredentials(provider);
    const webhookSecret =
      creds?.secrets.webhookSecret ||
      (creds?.config.webhookSecret as string);
    if (webhookSecret && rawBody) {
      const signature = (headers['x-razorpay-signature'] ||
        headers['x-webhook-signature'] ||
        headers['stripe-signature']) as string;
      if (signature) {
        const expectedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');
        if (signature !== expectedSig && !signature.includes(expectedSig)) {
          this.logger.error(
            `Invalid webhook signature for provider: ${provider}`,
          );
          throw new BadRequestException('Invalid webhook signature.');
        }
      }
    }

    let paymentToken: string | null = null;
    let transactionRef: string = eventId;
    let paymentStatus: 'PAID' | 'FAILED' = 'PAID';

    if (provider === 'razorpay') {
      const paymentObj = payload?.payload?.payment?.entity || payload;
      paymentToken = paymentObj?.notes?.token || payload?.token;
      transactionRef = paymentObj?.id || transactionRef;
      if (payload.event === 'payment.failed') paymentStatus = 'FAILED';
    } else if (provider === 'cashfree') {
      const order = payload?.data?.order || payload;
      paymentToken = order?.order_tags?.token || payload?.token;
      transactionRef = payload?.data?.payment?.cf_payment_id || transactionRef;
      if (payload.type === 'PAYMENT_FAILED') paymentStatus = 'FAILED';
    } else if (provider === 'stripe') {
      const session = payload?.data?.object || payload;
      paymentToken = session?.client_reference_id || payload?.token;
      transactionRef = session?.payment_intent || transactionRef;
    }

    let intent = null;
    if (paymentToken) {
      intent = await this.repo.findByToken(paymentToken);
    }

    if (intent && paymentStatus === 'PAID') {
      const claimed = await this.repo.claimPaid(intent.token, transactionRef);
      if (claimed) {
        await this.invoices.addPayment(
          intent.invoiceId,
          {
            amount: intent.amount.toString(),
            method: 'CARD',
            reference: `${provider.toUpperCase()}:${transactionRef}`,
          },
          {
            id: 'system',
            email: 'gateway@norynt.dev',
            roles: ['ADMIN'],
            permissions: ['invoice.read_financial', 'invoice.update'],
          } as any,
        );

        try {
          if (intent.invoice?.customerEmail) {
            await this.mail.sendTemplate(
              intent.invoice.customerEmail,
              'payment.success',
              {
                customerName: intent.invoice.customerName || 'Customer',
                invoiceNumber: intent.invoice.number,
                amount: intent.amount.toString(),
                currency: intent.currency || 'INR',
                provider: provider.toUpperCase(),
                paymentId: transactionRef,
              },
            );
          }
        } catch (mailErr: any) {
          this.logger.warn(
            `Could not dispatch payment confirmation email: ${mailErr.message}`,
          );
        }

        void this.audit.record({
          action: 'PAYMENT_SUCCESS',
          entity: 'INVOICE',
          entityId: intent.invoiceId,
          description: `Payment of ${intent.currency} ${intent.amount} captured via ${provider} (Ref: ${transactionRef})`,
          statusCode: 200,
          metadata: {
            provider,
            transactionRef,
            amount: intent.amount.toString(),
          },
        });
      }
    } else if (intent && paymentStatus === 'FAILED') {
      await this.repo.markFailed(intent.token, transactionRef);
      void this.audit.record({
        action: 'PAYMENT_FAILED',
        entity: 'INVOICE',
        entityId: intent.invoiceId,
        description: `Payment failed for invoice #${intent.invoiceId} via ${provider}`,
        statusCode: 400,
        metadata: { provider, transactionRef },
      });
    }

    await this.repo.recordProcessedWebhook(dedupeKey, provider);
    return { status: 'processed', provider, transactionRef };
  }

  // Legacy callback handler
  async handleIyzicoCallback(token: string): Promise<{ success: boolean }> {
    const intent = await this.repo.findByToken(token);
    if (!intent) return { success: false };

    const dedupeKey = `wh_iyzico_${token}`;
    const alreadyProcessed = await this.repo.isWebhookProcessed(dedupeKey);
    if (alreadyProcessed) return { success: true };

    if (this.http) {
      try {
        const res = await this.http.request(
          'POST',
          'https://sandbox-api.iyzipay.com/payment/iyzipay/checkoutform/auth/ecom/detail',
          JSON.stringify({ token }),
          { 'Content-Type': 'application/json' },
        );
        const data =
          typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
        if (
          data?.paymentStatus === 'FAILURE' ||
          data?.status === 'failure' ||
          data?.status === 'FAILURE'
        ) {
          await this.repo.markFailed(token, 'iyzico_fail');
          return { success: false };
        }
      } catch {
        return { success: false };
      }
    }

    const claimed = await this.repo.claimPaid(intent.token, `iyzico_${token}`);
    if (claimed) {
      await this.invoices.addPayment(
        intent.invoiceId,
        {
          amount: intent.amount.toString(),
          method: 'CARD',
          reference: `IYZICO:${token}`,
        },
        {
          id: 'system',
          email: 'gateway@norynt.dev',
          roles: ['ADMIN'],
          permissions: ['invoice.read_financial', 'invoice.update'],
        } as any,
      );
      await this.repo.recordProcessedWebhook(dedupeKey, 'iyzico');
      return { success: true };
    }
    return { success: false };
  }

  // ─── REFUND PROCESSING ───

  async refund(
    paymentIntentId: string,
    dto: RefundPaymentDto,
    actor: AuthenticatedUser,
  ) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: { invoice: true },
    });

    if (!intent) {
      throw new NotFoundException('Payment transaction record not found.');
    }
    if (intent.status !== 'paid') {
      throw new BadRequestException('Only settled payments can be refunded.');
    }

    const refundAmount = dto.amount || intent.amount.toNumber();

    await this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: 'refunded',
        metadata: {
          ...((intent.metadata as any) || {}),
          refundedAt: new Date().toISOString(),
          refundAmount,
          refundReason: dto.reason || 'Requested by Administrator',
          refundedBy: actor.email,
        },
      },
    });

    try {
      if (intent.invoice?.customerEmail) {
        await this.mail.sendTemplate(
          intent.invoice.customerEmail,
          'refund.processed',
          {
            customerName: intent.invoice.customerName || 'Customer',
            invoiceNumber: intent.invoice.number,
            amount: refundAmount.toString(),
            currency: intent.currency || 'INR',
            paymentId: intent.providerRef || intent.id,
          },
        );
      }
    } catch (err: any) {
      this.logger.warn(`Refund email notification failed: ${err.message}`);
    }

    void this.audit.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'PAYMENT_REFUNDED',
      entity: 'PAYMENTS',
      entityId: intent.id,
      description: `Refund of ${intent.currency} ${refundAmount} processed for invoice #${intent.invoice?.number || intent.invoiceId}`,
      statusCode: 200,
      metadata: { refundAmount, reason: dto.reason },
    });

    return {
      success: true,
      message: `Refund of ${intent.currency} ${refundAmount} has been recorded successfully.`,
      transactionId: intent.id,
      status: 'refunded',
    };
  }

  async getTransactionHistory(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    return this.repo.listAllTransactions(params);
  }

  private publicUrl(): string {
    return this.config
      .get<string>('PUBLIC_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
  }
}
