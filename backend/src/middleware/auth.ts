import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { getBearerToken } from '../lib/validation';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

function attachUserFromToken(req: AuthRequest): boolean {
  const token = getBearerToken(req);
  if (!token) {
    return false;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
    req.user = payload;
    return true;
  } catch {
    return false;
  }
}

function hasValidAdminKey(req: Request): boolean {
  if (!config.adminKey) {
    return false;
  }

  const adminKey = req.headers['x-admin-key'];
  return typeof adminKey === 'string' && adminKey === config.adminKey;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!attachUserFromToken(req)) {
    return res.status(401).json({ error: 'No autorizado: se requiere token valido' });
  }
  return next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!attachUserFromToken(req)) {
    return res.status(401).json({ error: 'No autorizado: se requiere token valido' });
  }
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
  }
  return next();
}

export function requireAdminOrKey(req: AuthRequest, res: Response, next: NextFunction) {
  if (attachUserFromToken(req) && req.user?.role === 'admin') {
    return next();
  }
  if (hasValidAdminKey(req)) {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin o x-admin-key valida' });
}
