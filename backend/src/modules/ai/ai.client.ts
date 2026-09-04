// src/modules/ai/ai.client.ts
// Anthropic istemcisini ortam değişkeninden üretir. ANTHROPIC_API_KEY yoksa null
// döner; AiService bu durumda 503 verir (anahtar OPSİYONEL — uygulama açılır).
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export const AI_CLIENT = 'AI_CLIENT';

export const aiClientProvider: Provider = {
  provide: AI_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Anthropic | null => {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) return null; // anahtar yok → AI devre dışı (graceful)
    return new Anthropic({ apiKey });
  },
};
