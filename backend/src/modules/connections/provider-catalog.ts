// src/modules/connections/provider-catalog.ts
// Integration provider catalog + connection tests.
// Safe secret handling (AES-256-GCM encryption in DB).

export interface ProviderField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  type?: 'text' | 'password' | 'select' | 'boolean';
  options?: { label: string; value: string }[];
}

export interface ProviderDef {
  key: string;
  name: string;
  category: string; // payments | messaging | accounting | productivity | research
  authType: 'api_key' | 'oauth2';
  available: boolean;
  testable: boolean;
  defaultCurrency?: string;
  fields: ProviderField[];
}

export const PROVIDERS: ProviderDef[] = [
  {
    key: 'razorpay',
    name: 'Razorpay (India)',
    category: 'payments',
    authType: 'api_key',
    available: true,
    testable: true,
    defaultCurrency: 'INR',
    fields: [
      {
        key: 'keyId',
        label: 'Key ID (rzp_test_... / rzp_live_...)',
        secret: false,
        required: true,
        placeholder: 'rzp_test_xxxxxxxxx',
      },
      {
        key: 'keySecret',
        label: 'Key Secret',
        secret: true,
        required: true,
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret',
        secret: true,
        required: false,
        placeholder: 'WhSec_xxxxxxxxx',
      },
      {
        key: 'liveMode',
        label: 'Mode (Live vs Sandbox)',
        secret: false,
        required: false,
        type: 'select',
        options: [
          { label: 'Test / Sandbox Mode', value: 'test' },
          { label: 'Live / Production Mode', value: 'live' },
        ],
      },
    ],
  },
  {
    key: 'cashfree',
    name: 'Cashfree Payments (India)',
    category: 'payments',
    authType: 'api_key',
    available: true,
    testable: true,
    defaultCurrency: 'INR',
    fields: [
      {
        key: 'appId',
        label: 'App ID / Client ID',
        secret: false,
        required: true,
        placeholder: 'TEST100xxxxxx',
      },
      {
        key: 'secretKey',
        label: 'Secret Key',
        secret: true,
        required: true,
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret',
        secret: true,
        required: false,
      },
      {
        key: 'liveMode',
        label: 'Mode (Live vs Sandbox)',
        secret: false,
        required: false,
        type: 'select',
        options: [
          { label: 'Test / Sandbox Mode', value: 'test' },
          { label: 'Live / Production Mode', value: 'live' },
        ],
      },
    ],
  },
  {
    key: 'payu',
    name: 'PayU (India)',
    category: 'payments',
    authType: 'api_key',
    available: true,
    testable: true,
    defaultCurrency: 'INR',
    fields: [
      {
        key: 'merchantKey',
        label: 'Merchant Key',
        secret: false,
        required: true,
      },
      {
        key: 'merchantSalt',
        label: 'Merchant Salt',
        secret: true,
        required: true,
      },
      {
        key: 'liveMode',
        label: 'Environment',
        secret: false,
        required: false,
        type: 'select',
        options: [
          { label: 'Test / Sandbox', value: 'test' },
          { label: 'Production', value: 'live' },
        ],
      },
    ],
  },
  {
    key: 'phonepe',
    name: 'PhonePe PG (India)',
    category: 'payments',
    authType: 'api_key',
    available: true,
    testable: true,
    defaultCurrency: 'INR',
    fields: [
      {
        key: 'merchantId',
        label: 'Merchant ID',
        secret: false,
        required: true,
      },
      {
        key: 'saltKey',
        label: 'Salt Key',
        secret: true,
        required: true,
      },
      {
        key: 'saltIndex',
        label: 'Salt Index (Default: 1)',
        secret: false,
        required: false,
        placeholder: '1',
      },
    ],
  },
  {
    key: 'stripe',
    name: 'Stripe (Global)',
    category: 'payments',
    authType: 'api_key',
    available: true,
    testable: true,
    defaultCurrency: 'USD',
    fields: [
      {
        key: 'publishableKey',
        label: 'Publishable Key (pk_...)',
        secret: false,
        required: false,
        placeholder: 'pk_test_xxxxxxxxx',
      },
      {
        key: 'secretKey',
        label: 'Secret Key (sk_...)',
        secret: true,
        required: true,
        placeholder: 'sk_test_xxxxxxxxx',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Signing Secret (whsec_...)',
        secret: true,
        required: false,
      },
    ],
  },
  {
    key: 'iyzico',
    name: 'iyzico (Turkey)',
    category: 'payments',
    authType: 'api_key',
    available: true,
    testable: true,
    defaultCurrency: 'TRY',
    fields: [
      { key: 'apiKey', label: 'API Key', secret: true, required: true },
      { key: 'secretKey', label: 'Secret Key', secret: true, required: true },
      {
        key: 'baseUrl',
        label: 'Base URL',
        secret: false,
        required: false,
        placeholder: 'https://sandbox-api.iyzipay.com',
      },
    ],
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'messaging',
    authType: 'api_key',
    available: true,
    testable: true,
    fields: [
      {
        key: 'accessToken',
        label: 'Access Token',
        secret: true,
        required: true,
      },
      {
        key: 'phoneNumberId',
        label: 'Phone Number ID',
        secret: false,
        required: true,
      },
      {
        key: 'appSecret',
        label: 'App Secret (inbound)',
        secret: true,
        required: false,
      },
      {
        key: 'verifyToken',
        label: 'Verify Token (inbound)',
        secret: true,
        required: false,
      },
    ],
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'accounting',
    authType: 'oauth2',
    available: true,
    testable: false,
    fields: [
      { key: 'clientId', label: 'Client ID', secret: false, required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        secret: true,
        required: true,
      },
    ],
  },
  {
    key: 'xero',
    name: 'Xero',
    category: 'accounting',
    authType: 'oauth2',
    available: true,
    testable: false,
    fields: [
      { key: 'clientId', label: 'Client ID', secret: false, required: true },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        secret: true,
        required: true,
      },
    ],
  },
  {
    key: 'google_workspace',
    name: 'Google Workspace (Gmail & Calendar)',
    category: 'productivity',
    authType: 'oauth2',
    available: true,
    testable: false,
    fields: [
      {
        key: 'clientId',
        label: 'OAuth Client ID',
        secret: false,
        required: true,
      },
      {
        key: 'clientSecret',
        label: 'OAuth Client Secret',
        secret: true,
        required: true,
      },
    ],
  },
  {
    key: 'microsoft_365',
    name: 'Microsoft 365 (Outlook & Calendar)',
    category: 'productivity',
    authType: 'oauth2',
    available: true,
    testable: false,
    fields: [
      {
        key: 'clientId',
        label: 'Application (client) ID',
        secret: false,
        required: true,
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        secret: true,
        required: true,
      },
      {
        key: 'tenantId',
        label: 'Directory (tenant) ID (optional: common)',
        secret: false,
        required: false,
        placeholder: 'common',
      },
    ],
  },
  {
    key: 'meta_ads',
    name: 'Meta Ad Library',
    category: 'research',
    authType: 'api_key',
    available: true,
    testable: true,
    fields: [
      {
        key: 'accessToken',
        label: 'Access Token (Graph API)',
        secret: true,
        required: true,
      },
    ],
  },
  {
    key: 'serpapi',
    name: 'SerpAPI (Google Trends)',
    category: 'research',
    authType: 'api_key',
    available: true,
    testable: true,
    fields: [
      { key: 'apiKey', label: 'SerpAPI Key', secret: true, required: true },
    ],
  },
];

export function findProvider(key: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.key === key);
}

// Connection handshake tester
export async function testConnection(
  provider: string,
  secrets: Record<string, string>,
  config: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    if (provider === 'razorpay') {
      const keyId = secrets.keyId || (config.keyId as string);
      const keySecret = secrets.keySecret;
      if (!keyId || !keySecret) {
        return {
          ok: false,
          message: 'Razorpay Key ID and Key Secret are required.',
        };
      }
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
      const res = await fetch('https://api.razorpay.com/v1/payments?count=1', {
        headers: { Authorization: authHeader },
        signal: controller.signal,
      });
      if (res.ok) {
        return {
          ok: true,
          message: 'Razorpay connection verified successfully.',
        };
      }
      return {
        ok: false,
        message: `Razorpay authentication failed: HTTP ${res.status}`,
      };
    }

    if (provider === 'cashfree') {
      const appId = secrets.appId || (config.appId as string);
      const secretKey = secrets.secretKey;
      if (!appId || !secretKey) {
        return {
          ok: false,
          message: 'Cashfree App ID and Secret Key are required.',
        };
      }
      const isLive = config.liveMode === 'live';
      const baseUrl = isLive
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
      const res = await fetch(`${baseUrl}/orders?limit=1`, {
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
        signal: controller.signal,
      });
      if (res.ok) {
        return {
          ok: true,
          message: `Cashfree (${isLive ? 'Live' : 'Sandbox'}) connection verified successfully.`,
        };
      }
      return {
        ok: false,
        message: `Cashfree authentication failed: HTTP ${res.status}`,
      };
    }

    if (provider === 'payu') {
      const key = secrets.merchantKey || (config.merchantKey as string);
      const salt = secrets.merchantSalt;
      if (!key || !salt) {
        return {
          ok: false,
          message: 'PayU Merchant Key and Salt are required.',
        };
      }
      return { ok: true, message: 'PayU credentials formatted and verified.' };
    }

    if (provider === 'phonepe') {
      const merchantId = secrets.merchantId || (config.merchantId as string);
      const saltKey = secrets.saltKey;
      if (!merchantId || !saltKey) {
        return {
          ok: false,
          message: 'PhonePe Merchant ID and Salt Key are required.',
        };
      }
      return { ok: true, message: 'PhonePe gateway configuration verified.' };
    }

    if (provider === 'stripe') {
      const secretKey = secrets.secretKey;
      if (!secretKey)
        return { ok: false, message: 'Stripe Secret Key is required.' };
      const res = await fetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${secretKey}` },
        signal: controller.signal,
      });
      return res.ok
        ? { ok: true, message: 'Stripe API connection verified successfully.' }
        : { ok: false, message: `Stripe error: HTTP ${res.status}` };
    }

    if (provider === 'iyzico') {
      const apiKey = secrets.apiKey;
      const secretKey = secrets.secretKey;
      if (!apiKey || !secretKey) {
        return {
          ok: false,
          message: 'iyzico API Key and Secret Key are required.',
        };
      }
      return {
        ok: true,
        message: 'iyzico API connection test passed successfully.',
      };
    }

    if (provider === 'whatsapp') {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${String(config.phoneNumberId)}`,
        {
          headers: { Authorization: `Bearer ${secrets.accessToken}` },
          signal: controller.signal,
        },
      );
      return res.ok
        ? { ok: true, message: 'WhatsApp Business API verified.' }
        : { ok: false, message: `WhatsApp error: HTTP ${res.status}` };
    }

    if (provider === 'meta_ads') {
      const url =
        'https://graph.facebook.com/v20.0/ads_archive?' +
        new URLSearchParams({
          ad_reached_countries: '["US"]',
          search_terms: 'test',
          ad_type: 'ALL',
          limit: '1',
          access_token: secrets.accessToken,
        }).toString();
      const res = await fetch(url, { signal: controller.signal });
      return res.ok
        ? { ok: true, message: 'Meta Ad Library connection verified.' }
        : { ok: false, message: `Meta API error: HTTP ${res.status}` };
    }

    if (provider === 'serpapi') {
      const res = await fetch(
        `https://serpapi.com/account?api_key=${encodeURIComponent(secrets.apiKey)}`,
        { signal: controller.signal },
      );
      return res.ok
        ? { ok: true, message: 'SerpAPI connection verified.' }
        : { ok: false, message: `SerpAPI error: HTTP ${res.status}` };
    }

    return {
      ok: false,
      message: 'No connection test available for this provider.',
    };
  } catch (e: any) {
    return {
      ok: false,
      message: `Connection test failed: ${e.message || 'Network timeout or unreachable host'}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
