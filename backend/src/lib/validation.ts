import type { Request } from 'express';

export class ValidationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

export function ensureString(value: unknown, fieldName: string, options?: { minLength?: number; maxLength?: number; optional?: boolean }): string {
  const optional = options?.optional ?? false;

  if (value === undefined || value === null) {
    if (optional) return '';
    throw new ValidationError(`${fieldName} is required`);
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (!optional && trimmed.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }

  if (options?.minLength && trimmed.length < options.minLength) {
    throw new ValidationError(`${fieldName} must have at least ${options.minLength} characters`);
  }

  if (options?.maxLength && trimmed.length > options.maxLength) {
    throw new ValidationError(`${fieldName} must have at most ${options.maxLength} characters`);
  }

  return trimmed;
}

export function ensurePositiveInt(value: unknown, fieldName: string, options?: { min?: number; max?: number; fallback?: number }): number {
  if (value === undefined || value === null || value === '') {
    if (options?.fallback !== undefined) return options.fallback;
    throw new ValidationError(`${fieldName} is required`);
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }

  if (options?.min !== undefined && parsed < options.min) {
    throw new ValidationError(`${fieldName} must be >= ${options.min}`);
  }

  if (options?.max !== undefined && parsed > options.max) {
    throw new ValidationError(`${fieldName} must be <= ${options.max}`);
  }

  return parsed;
}

export function ensureStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  const normalized = value
    .map((entry) => {
      if (typeof entry !== 'string') {
        throw new ValidationError(`${fieldName} must contain only strings`);
      }
      return entry.trim();
    })
    .filter((entry) => entry.length > 0);

  return normalized;
}

export function parseCsvParam(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
