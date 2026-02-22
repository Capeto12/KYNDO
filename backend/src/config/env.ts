import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_JWT_SECRET = 'kyndo-dev-secret-change-in-production';
const WEAK_SECRET_MARKER = 'change-in-production';

export interface AppConfig {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  jwtSecret: string;
  jwtExpires: string;
  adminKey?: string;
  corsOrigins: string[] | '*';
  allowLocalImport: boolean;
  importLocalRoot: string;
}

function parsePort(rawPort: string | undefined): number {
  const parsed = Number.parseInt(rawPort ?? '3000', 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return 3000;
  }
  return parsed;
}

function parseCorsOrigins(rawOrigins: string | undefined): string[] | '*' {
  if (!rawOrigins || rawOrigins.trim() === '') {
    return '*';
  }

  if (rawOrigins.trim() === '*') {
    return '*';
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function validateJwtSecret(secret: string | undefined, isProduction: boolean): string {
  const resolved = secret?.trim() || DEFAULT_JWT_SECRET;

  if (isProduction) {
    const isWeak = resolved.length < 32 || resolved.includes(WEAK_SECRET_MARKER);
    if (isWeak) {
      throw new Error('Invalid JWT_SECRET: production requires a strong secret (min 32 chars)');
    }
  }

  return resolved;
}

function toBoolean(value: string | undefined): boolean {
  return (value ?? '').toLowerCase() === 'true';
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

export const config: AppConfig = {
  nodeEnv,
  isProduction,
  port: parsePort(process.env.PORT),
  jwtSecret: validateJwtSecret(process.env.JWT_SECRET, isProduction),
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  adminKey: process.env.ADMIN_KEY,
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  allowLocalImport: toBoolean(process.env.ALLOW_LOCAL_IMPORT),
  importLocalRoot: path.resolve(process.env.IMPORT_LOCAL_ROOT || path.join(process.cwd(), 'uploads', 'imports')),
};
