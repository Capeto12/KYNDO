import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kyndo-dev-secret-change-in-production';

export interface AuthRequest extends Request {
    user?: { userId: string; role: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado — se requiere token' });
    }
    try {
        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        req.user = payload;
        return next();
    } catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado — se requiere rol admin' });
        }
        return next();
    });
}
