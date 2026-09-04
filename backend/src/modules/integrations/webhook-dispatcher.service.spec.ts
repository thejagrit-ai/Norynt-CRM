// src/modules/integrations/webhook-dispatcher.service.spec.ts
import { DeliveryStatus } from '@prisma/client';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { IntegrationsRepository } from './integrations.repository';
import { IHttpClient } from './http/http-client.interface';
import { verifySignature } from './util/webhook-signature.util';

describe('WebhookDispatcherService', () => {
  let dispatcher: WebhookDispatcherService;
  let repo: { createDelivery: jest.Mock; updateDelivery: jest.Mock };
  let http: { post: jest.Mock };

  const sub = {
    id: 'sub-1',
    url: 'https://hook.example.com',
    secret: 's3cr3t',
  };

  beforeEach(() => {
    repo = {
      createDelivery: jest.fn().mockResolvedValue({ id: 'del-1' }),
      updateDelivery: jest
        .fn()
        .mockImplementation((id, data) => ({ id, ...data })),
    };
    http = { post: jest.fn() };
    dispatcher = new WebhookDispatcherService(
      repo as unknown as IntegrationsRepository,
      http as unknown as IHttpClient,
    );
  });

  // E-5.4 — başarılı teslimat + imza doğrulanabilir
  it('2xx → SUCCESS ve gönderilen imza doğrulanabilir', async () => {
    http.post.mockResolvedValue({ status: 200 });
    const res = await dispatcher.dispatch(sub, 'invoice.paid', { id: 'inv-1' });

    expect(res.status).toBe(DeliveryStatus.SUCCESS);
    // http.post(url, body, headers, timeout) — imzayı header'dan doğrula
    const [url, body, headers] = http.post.mock.calls[0];
    expect(url).toBe(sub.url);
    const ts = Number(headers['X-CRM-Timestamp']);
    expect(
      verifySignature({
        secret: sub.secret,
        timestamp: ts,
        body,
        signature: headers['X-CRM-Signature'],
        nowSec: ts,
      }),
    ).toBe(true);
    expect(headers['X-CRM-Event']).toBe('invoice.paid');
    expect(headers['X-CRM-Delivery']).toBe('del-1');
  });

  // E-5.5 — alıcı 500 → FAILED + retry planlanır
  it('5xx → FAILED ve nextRetryAt planlanır', async () => {
    http.post.mockResolvedValue({ status: 500 });
    const res = await dispatcher.dispatch(sub, 'invoice.paid', { id: 'x' });
    expect(res.status).toBe(DeliveryStatus.FAILED);
    expect(res.nextRetryAt).toBeInstanceOf(Date);
    expect(res.attempts).toBe(1);
  });

  // C-5.1 — timeout/throw → FAILED (sistem bloklanmaz)
  it('network/timeout hatası → FAILED', async () => {
    http.post.mockRejectedValue(new Error('aborted'));
    const res = await dispatcher.dispatch(sub, 'deal.created', { id: 'x' });
    expect(res.status).toBe(DeliveryStatus.FAILED);
    expect(res.lastError).toContain('aborted');
  });
});
