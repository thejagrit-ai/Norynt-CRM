// src/modules/connections/oauth-catalog.ts
// OAuth2 sağlayıcı uçları (v3.2). redirect_uri = `${APP_PUBLIC_URL}/api/v1/connections/oauth/callback`.
export interface OAuthProviderDef {
  key: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  // Callback'te gelen ekstra parametreler config'e yazılır (örn. QBO realmId).
  extraCallbackParams: string[];
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderDef> = {
  quickbooks: {
    key: 'quickbooks',
    authorizeUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scope: 'com.intuit.quickbooks.accounting',
    extraCallbackParams: ['realmId'],
  },
  xero: {
    key: 'xero',
    authorizeUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    scope: 'offline_access accounting.transactions accounting.contacts',
    extraCallbackParams: [],
  },
  google_workspace: {
    key: 'google_workspace',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope:
      'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events',
    extraCallbackParams: [],
  },
  microsoft_365: {
    key: 'microsoft_365',
    authorizeUrl:
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'offline_access Mail.Send Calendars.ReadWrite User.Read',
    extraCallbackParams: [],
  },
};
