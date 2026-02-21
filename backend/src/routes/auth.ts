import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kyndo-dev-secret-change-in-production';
const JWT_EXPIRES = '7d';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, passwordHash, username },
            select: { id: true, email: true, username: true, role: true, createdAt: true },
        });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        return res.status(201).json({ user, token });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        return res.json({
            user: { id: user.id, email: user.email, username: user.username, role: user.role },
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// GET /api/auth/me  (requires auth middleware)
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, username: true, role: true, createdAt: true },
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        return res.json(user);
    } catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
});

export default router;
