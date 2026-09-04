// src/common/utils/secret-redaction.util.ts
// Centralized, enterprise-grade secret redaction utility.
// Automatically masks API secrets, passwords, tokens, webhook secrets, and private keys.

const SENSITIVE_KEY_REGEX =
  /password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|auth|bearer|private[_-]?key|salt|credential|webhook[_-]?secret|app[_-]?secret|smtp[_-]?pass/i;

export function redactSecrets<T = any>(obj: T, depth = 0): T {
  if (obj === null || obj === undefined || depth > 8) return obj;

  if (typeof obj === 'string') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item, depth + 1)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        if (typeof value === 'string' && value.length > 8) {
          result[key] = `${value.slice(0, 4)}••••${value.slice(-3)}`;
        } else {
          result[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactSecrets(value, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  return obj;
}

export function sanitizeDiff(
  before?: any,
  after?: any,
): { before?: any; after?: any } {
  return {
    before: before ? redactSecrets(before) : undefined,
    after: after ? redactSecrets(after) : undefined,
  };
}
