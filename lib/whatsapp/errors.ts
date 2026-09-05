import type { ErrorClassification } from './types';

export class WhatsAppError extends Error {
  classification: ErrorClassification;
  code?: string | number;

  constructor(
    message: string,
    classification: ErrorClassification = 'NON_RETRYABLE',
    code?: string | number
  ) {
    super(message);
    this.name = 'WhatsAppError';
    this.classification = classification;
    this.code = code;
  }
}

export class WhatsAppApiError extends WhatsAppError {
  httpStatus: number;
  metaCode?: number;
  metaSubcode?: number;
  fbtraceId?: string;

  constructor(
    message: string,
    httpStatus: number,
    metaCode?: number,
    metaSubcode?: number,
    fbtraceId?: string
  ) {
    const classification = classifyMetaError(httpStatus, metaCode, metaSubcode);
    super(message, classification, metaCode ? `META_${metaCode}` : `HTTP_${httpStatus}`);
    this.name = 'WhatsAppApiError';
    this.httpStatus = httpStatus;
    this.metaCode = metaCode;
    this.metaSubcode = metaSubcode;
    this.fbtraceId = fbtraceId;
  }
}

export class WhatsAppValidationError extends WhatsAppError {
  constructor(message: string) {
    super(message, 'NON_RETRYABLE', 'VALIDATION_ERROR');
    this.name = 'WhatsAppValidationError';
  }
}

export class WhatsAppConfigError extends WhatsAppError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 'CONFIG_ERROR');
    this.name = 'WhatsAppConfigError';
  }
}

export class WhatsAppTimeoutError extends WhatsAppError {
  constructor(message: string = 'WhatsApp API request timed out') {
    super(message, 'RETRYABLE', 'TIMEOUT');
    this.name = 'WhatsAppTimeoutError';
  }
}

/**
 * Classifies Meta Graph API errors into Retryable, Non-Retryable, or Configuration Errors.
 * Reference: Meta WhatsApp Cloud API Error Codes
 */
export function classifyMetaError(
  httpStatus: number,
  metaCode?: number,
  metaSubcode?: number
): ErrorClassification {
  // Authentication & Configuration errors
  if (
    httpStatus === 401 ||
    metaCode === 190 || // Invalid OAuth access token
    metaCode === 10 || // Permission denied
    metaCode === 100 || // Unsupported parameter / endpoint
    metaCode === 200 || // Permission error
    metaCode === 131031 // Account locked or payment issue
  ) {
    return 'CONFIGURATION_ERROR';
  }

  // Rate Limiting & Temporary Server Outages -> Retryable
  if (
    httpStatus === 429 ||
    httpStatus === 500 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    httpStatus === 504 ||
    metaCode === 130429 || // Cloud API rate limit hit
    metaCode === 80007 || // Rate limit issues
    metaCode === 131056 // Server overload / concurrency limit
  ) {
    return 'RETRYABLE';
  }

  // Parameter, Template, Number & Policy Errors -> Non-Retryable
  if (
    metaCode === 131026 || // Template param count mismatch
    metaCode === 132000 || // Template does not exist
    metaCode === 132001 || // Template is paused
    metaCode === 132007 || // Template hydration error
    metaCode === 131051 || // Unsupported message type or phone
    metaCode === 131052 || // Media download failed
    metaCode === 131053 || // Media upload failed
    metaCode === 131047 || // Re-engagement window expired
    metaCode === 131000 // Something wrong with recipient number
  ) {
    return 'NON_RETRYABLE';
  }

  if (httpStatus >= 400 && httpStatus < 500) {
    return 'NON_RETRYABLE';
  }

  if (httpStatus >= 500) {
    return 'RETRYABLE';
  }

  return 'NON_RETRYABLE';
}
