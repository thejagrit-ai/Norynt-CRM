// src/modules/integrations/util/backoff.util.ts
// Üstel geri çekilme (backoff): 1m, 5m, 30m, 2h, 6h. Tükenince null → DEAD.
// Saf: now (ms) parametre olarak alınır (test edilebilirlik).
export const BACKOFF_SCHEDULE_SEC = [60, 300, 1800, 7200, 21600];
export const MAX_ATTEMPTS = BACKOFF_SCHEDULE_SEC.length;

// attemptsMade: şu ana kadar yapılan deneme sayısı (1 = ilk deneme başarısız oldu).
// Bir sonraki deneme zamanını döndürür; denemeler tükendiyse null (→ DEAD).
export function computeNextRetry(
  attemptsMade: number,
  nowMs: number,
): Date | null {
  if (attemptsMade >= MAX_ATTEMPTS) {
    return null;
  }
  const delaySec = BACKOFF_SCHEDULE_SEC[attemptsMade];
  return new Date(nowMs + delaySec * 1000);
}
