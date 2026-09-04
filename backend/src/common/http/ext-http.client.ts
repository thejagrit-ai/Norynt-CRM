// src/common/http/ext-http.client.ts
// Dış servis HTTP soyutlaması (OAuth token değişimi, muhasebe API'leri).
// Testte stub'lanır → e2e ağa çıkmaz.
import { Injectable } from '@nestjs/common';

export const EXT_HTTP = Symbol('EXT_HTTP');

export interface ExtHttpResponse {
  status: number;
  body: string;
}

export interface IExtHttpClient {
  request(
    method: 'GET' | 'POST' | 'PUT',
    url: string,
    body: string | null,
    headers: Record<string, string>,
  ): Promise<ExtHttpResponse>;
}

@Injectable()
export class FetchExtHttpClient implements IExtHttpClient {
  async request(
    method: 'GET' | 'POST' | 'PUT',
    url: string,
    body: string | null,
    headers: Record<string, string>,
  ): Promise<ExtHttpResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ?? undefined,
        signal: controller.signal,
      });
      return { status: res.status, body: await res.text() };
    } finally {
      clearTimeout(timer);
    }
  }
}
