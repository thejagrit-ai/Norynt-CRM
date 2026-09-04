// src/common/filters/all-exceptions.filter.ts
// Global Exception Filter with automatic multi-language localization.
// Defaults to English (en). Resolves Accept-Language / x-locale header.
// Standardized format: { statusCode, code, message, details, timestamp, path }.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  resolveLocale,
  translateBackend,
  TURKISH_PHRASE_MAP,
} from '../i18n/backend-translations';

interface ErrorResponseEnvelope {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
  // Backwards-compatibility for older clients
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const acceptLang = (request.headers['x-locale'] ||
      request.headers['accept-language'] ||
      'en') as string;
    const locale = resolveLocale(acceptLang);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let rawMessage = 'An unexpected server error occurred.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        rawMessage = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        if (Array.isArray(r.message)) {
          rawMessage = 'Validation error occurred.';
          details = r.message;
          code = 'VALIDATION_ERROR';
        } else if (typeof r.message === 'string') {
          rawMessage = r.message;
        }
      }

      if (code === 'INTERNAL_SERVER_ERROR') {
        code = this.statusToCode(status);
      }
    }

    // Map and translate message based on locale
    let finalMessage = rawMessage;

    // Check if rawMessage is a legacy Turkish phrase
    const normalizedKey = rawMessage.trim().toLowerCase();
    const mappedKey = TURKISH_PHRASE_MAP[normalizedKey];

    if (mappedKey) {
      finalMessage = translateBackend(mappedKey, locale);
    } else if (status === HttpStatus.FORBIDDEN) {
      finalMessage = translateBackend('errors.forbidden', locale, rawMessage);
    } else if (status === HttpStatus.UNAUTHORIZED) {
      finalMessage = translateBackend(
        'errors.unauthorized',
        locale,
        rawMessage,
      );
    } else if (
      status === HttpStatus.NOT_FOUND &&
      rawMessage.toLowerCase().includes('not found')
    ) {
      finalMessage = translateBackend('errors.notFound', locale, rawMessage);
    } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
      finalMessage = translateBackend(
        'errors.tooManyRequests',
        locale,
        rawMessage,
      );
    }

    // Developer / Server log (internal technical log in English)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${status} [${code}]: ${finalMessage}`,
      );
    }

    const envelope: ErrorResponseEnvelope = {
      statusCode: status,
      code,
      message: finalMessage,
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false,
      error: {
        code,
        message: finalMessage,
        ...(details !== undefined ? { details } : {}),
      },
    };

    response.status(status).json(envelope);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };
    return map[status] ?? 'ERROR';
  }
}
