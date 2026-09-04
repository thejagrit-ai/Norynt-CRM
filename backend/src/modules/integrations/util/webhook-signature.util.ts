// src/modules/integrations/util/webhook-signature.util.ts
// HMAC-SHA256 imza: imza = HMAC(secret, `${timestamp}.${body}`) → "sha256=<hex>".
// Doğrulama sabit zamanlı (timingSafeEqual) + timestamp penceresi (replay engeli).
import { createHmac, timingSafeEqual } from 'crypto';

export const DEFAULT_TOLERANCE_SEC = 300; // ±5 dk

export function signPayload(
  secret: string,
  timestamp: number,
  body: string,
): string {
  const mac = createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return `sha256=${mac}`;
}

export function verifySignature(params: {
  secret: string;
  timestamp: number;
  body: string;
  signature: string;
  nowSec: number;
  toleranceSec?: number;
}): boolean {
  const tolerance = params.toleranceSec ?? DEFAULT_TOLERANCE_SEC;
  // Replay engeli: timestamp penceresi dışındaysa reddet.
  if (Math.abs(params.nowSec - params.timestamp) > tolerance) {
    return false;
  }
  const expected = signPayload(params.secret, params.timestamp, params.body);
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
