import { Router, Response } from 'express';
import prisma from '../prismaClient';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats — global counts
router.get('/stats', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
        const [userCount, cardCount, packCount] = await Promise.all([
            prisma.user.count(),
            prisma.card.count(),
            prisma.pack.count(),
        ]);
        return res.json({
            users: userCount,
            cards: cardCount,
            packs: packCount,
        });
    } catch {
        return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// GET /api/admin/users — list all users
router.get('/', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: { select: { cards: true, purchases: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ count: users.length, users });
    } catch {
        return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// GET /api/admin/users/:id — user detail + cards
router.get('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, email: true, username: true, role: true, isActive: true, createdAt: true,
                cards: {
                    include: {
                        card: { select: { cardId: true, title: true, rarity: true, imageUrl: true } },
                    },
                },
            },
        });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        return res.json(user);
    } catch {
        return res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// PATCH /api/admin/users/:id — update role or active status
router.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { role, isActive, username } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role, isActive, username },
            select: { id: true, email: true, username: true, role: true, isActive: true },
        });
        return res.json(user);
    } catch {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }
});

// DELETE /api/admin/users/:id
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        return res.json({ success: true });
    } catch {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }
});

export default router;
