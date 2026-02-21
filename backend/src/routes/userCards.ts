import { Router, Response } from 'express';
import prisma from '../prismaClient';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/me/cards — logged-in user's collection
router.get('/me/cards', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userCards = await prisma.userCard.findMany({
            where: { userId: req.user!.userId },
            include: {
                card: {
                    select: { cardId: true, title: true, rarity: true, packId: true, imageUrl: true, thumbnailPath: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ count: userCards.length, cards: userCards });
    } catch (err) {
        return res.status(500).json({ error: 'Error al obtener colección' });
    }
});

// POST /api/admin/users/:userId/grant-card — admin grants card to a user
router.post('/admin/users/:userId/grant-card', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { cardId, quantity = 1 } = req.body;

        if (!cardId) return res.status(400).json({ error: 'cardId es requerido' });

        // Verify card and user exist
        const [card, user] = await Promise.all([
            prisma.card.findUnique({ where: { id: cardId } }),
            prisma.user.findUnique({ where: { id: userId } }),
        ]);
        if (!card) return res.status(404).json({ error: 'Carta no encontrada' });
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const userCard = await prisma.userCard.upsert({
            where: { userId_cardId: { userId, cardId } },
            create: { userId, cardId, quantity: Number(quantity), source: 'granted' },
            update: { quantity: { increment: Number(quantity) } },
        });

        return res.json({ success: true, userCard });
    } catch (err) {
        return res.status(500).json({ error: 'Error al otorgar carta' });
    }
});

export default router;
