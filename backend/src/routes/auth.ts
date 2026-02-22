import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

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

// GET /api/auth/google/url
router.get('/google/url', (req: Request, res: Response) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    });
    res.json({ url });
});

// POST /api/auth/google/callback
router.post('/google/callback', async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Código de autorización requerido' });

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        if (!data.email) return res.status(400).json({ error: 'No se obtuvo el email de Google' });

        let user = await prisma.user.findUnique({ where: { email: data.email } });

        if (!user) {
            // Create user and grant initial collection
            user = await prisma.user.create({
                data: {
                    email: data.email,
                    googleId: data.id,
                    displayName: data.name,
                    avatarUrl: data.picture,
                }
            });
            await grantInitialCollection(user.id);
        } else if (!user.googleId) {
            // Link existing account
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: data.id,
                    displayName: user.displayName || data.name,
                    avatarUrl: user.avatarUrl || data.picture
                }
            });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                pairsGrade: user.pairsGrade,
                role: user.role
            },
            token,
        });
    } catch (err) {
        console.error('Google callback error:', err);
        return res.status(500).json({ error: 'Error en la autenticación con Google' });
    }
});

/**
 * Grants 120 cards (40 initial birds x 3 copies each) to a new user
 */
async function grantInitialCollection(userId: string) {
    try {
        // Find the first 40 cards available (usually from pack-1 or similar)
        const cards = await prisma.card.findMany({
            take: 40,
            orderBy: { createdAt: 'asc' }
        });

        if (cards.length === 0) {
            console.warn('[Auth] No cards found in DB to grant to user', userId);
            return;
        }

        const userCardsData = cards.map(card => ({
            userId,
            cardId: card.id,
            quantity: 3,
            source: 'initial'
        }));

        await prisma.userCard.createMany({
            data: userCardsData,
            skipDuplicates: true
        });

        console.log(`[Auth] Granted ${cards.length} cards (x3) to user ${userId}`);
    } catch (err) {
        console.error('[Auth] Error granting initial collection:', err);
    }
}

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
