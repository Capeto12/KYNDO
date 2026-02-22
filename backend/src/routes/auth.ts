import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { config } from '../config/env';
import { ValidationError, ensureString, getBearerToken } from '../lib/validation';

const router = Router();

function handleValidationError(res: Response, error: unknown) {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  return null;
}

function signToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    config.jwtSecret as jwt.Secret,
    { expiresIn: config.jwtExpires as jwt.SignOptions['expiresIn'] }
  );
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const email = ensureString(req.body.email, 'email', { minLength: 5, maxLength: 200 }).toLowerCase();
    const password = ensureString(req.body.password, 'password', { minLength: 8, maxLength: 200 });
    const usernameRaw = req.body.username;
    const username = typeof usernameRaw === 'string' ? usernameRaw.trim() : null;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'El email ya esta registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, username },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });

    const token = signToken(user.id, user.role);
    return res.status(201).json({ user, token });
  } catch (error) {
    const validationResponse = handleValidationError(res, error);
    if (validationResponse) return validationResponse;

    console.error('Register error:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = ensureString(req.body.email, 'email', { minLength: 5, maxLength: 200 }).toLowerCase();
    const password = ensureString(req.body.password, 'password', { minLength: 8, maxLength: 200 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || !user.passwordHash) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = signToken(user.id, user.role);
    return res.json({
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      token,
    });
  } catch (error) {
    const validationResponse = handleValidationError(res, error);
    if (validationResponse) return validationResponse;

    console.error('Login error:', error);
    return res.status(500).json({ error: 'Error al iniciar sesion' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const payload = jwt.verify(token, config.jwtSecret as jwt.Secret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(user);
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
});

export default router;
