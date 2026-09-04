// src/modules/integrations/util/webhook-signature.util.spec.ts
import { signPayload, verifySignature } from './webhook-signature.util';

describe('webhook signature', () => {
  const secret = 'topsecret';
  const ts = 1_751_000_000;
  const body = '{"event":"invoice.paid","id":"x"}';

  // U-5.1 — deterministik HMAC
  it('signPayload deterministiktir ve sha256= ön ekli', () => {
    const a = signPayload(secret, ts, body);
    const b = signPayload(secret, ts, body);
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('verify doğru imzayı kabul eder', () => {
    const sig = signPayload(secret, ts, body);
    expect(
      verifySignature({
        secret,
        timestamp: ts,
        body,
        signature: sig,
        nowSec: ts,
      }),
    ).toBe(true);
  });

  // U-5.2 — yanlış imza
  it('verify yanlış imzayı reddeder', () => {
    expect(
      verifySignature({
        secret,
        timestamp: ts,
        body,
        signature: 'sha256=deadbeef',
        nowSec: ts,
      }),
    ).toBe(false);
  });

  it('verify yanlış secret ile reddeder', () => {
    const sig = signPayload(secret, ts, body);
    expect(
      verifySignature({
        secret: 'other',
        timestamp: ts,
        body,
        signature: sig,
        nowSec: ts,
      }),
    ).toBe(false);
  });

  // U-5.3 — eski timestamp (replay)
  it("verify pencere dışı timestamp'i reddeder (replay)", () => {
    const sig = signPayload(secret, ts, body);
    expect(
      verifySignature({
        secret,
        timestamp: ts,
        body,
        signature: sig,
        nowSec: ts + 10_000, // tolerans çok aşıldı
      }),
    ).toBe(false);
  });
});
