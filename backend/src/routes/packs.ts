import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/packs — list active packs (public)
router.get('/', async (_req: Request, res: Response) => {
    try {
        const packs = await prisma.pack.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ count: packs.length, packs });
    } catch {
        return res.status(500).json({ error: 'Error al obtener paquetes' });
    }
});

// GET /api/packs/:id — pack detail
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const pack = await prisma.pack.findUnique({ where: { id: req.params.id } });
        if (!pack) return res.status(404).json({ error: 'Paquete no encontrado' });
        return res.json(pack);
    } catch {
        return res.status(500).json({ error: 'Error al obtener paquete' });
    }
});

// POST /api/packs/:id/open — user opens a pack (assigns random cards)
router.post('/:id/open', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const pack = await prisma.pack.findUnique({ where: { id: req.params.id } });
        if (!pack || !pack.isActive) {
            return res.status(404).json({ error: 'Paquete no disponible' });
        }

        const userId = req.user!.userId;
        const rarityPool = (pack.rarityPool as Record<string, number>) || {
            abundante: 50,
            frecuente: 30,
            rara: 15,
            excepcional: 5,
        };

        // Pick random cards weighted by rarity
        const wonCardIds: string[] = [];
        for (let i = 0; i < pack.cardCount; i++) {
            const rarity = weightedRarity(rarityPool);
            const candidates = await prisma.card.findMany({
                where: { rarity },
                select: { id: true },
                take: 50,
            });
            if (candidates.length === 0) continue;
            const picked = candidates[Math.floor(Math.random() * candidates.length)];
            wonCardIds.push(picked.id);
        }

        // Add cards to user collection
        await Promise.all(
            wonCardIds.map((cardId) =>
                prisma.userCard.upsert({
                    where: { userId_cardId: { userId, cardId } },
                    create: { userId, cardId, quantity: 1, source: 'purchased' },
                    update: { quantity: { increment: 1 } },
                })
            )
        );

        // Record purchase
        const purchase = await prisma.packPurchase.create({
            data: { userId, packId: pack.id, status: 'completed', cardsWon: wonCardIds },
        });

        // Return cards with full info
        const wonCards = await prisma.card.findMany({
            where: { id: { in: wonCardIds } },
            select: { id: true, cardId: true, title: true, rarity: true, imageUrl: true, thumbnailPath: true },
        });

        return res.json({ purchase: { id: purchase.id }, wonCards });
    } catch (err) {
        console.error('Pack open error:', err);
        return res.status(500).json({ error: 'Error al abrir paquete' });
    }
});

// POST /api/admin/packs — admin creates pack
router.post('/admin', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, price, cardCount, rarityPool, imageUrl } = req.body;
        if (!name) return res.status(400).json({ error: 'name es requerido' });

        const pack = await prisma.pack.create({
            data: {
                name,
                description,
                price: price ?? 0,
                cardCount: cardCount ?? 5,
                rarityPool,
                imageUrl,
            },
        });
        return res.status(201).json(pack);
    } catch {
        return res.status(500).json({ error: 'Error al crear paquete' });
    }
});

// PATCH /api/admin/packs/:id — admin edits pack
router.patch('/admin/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, price, cardCount, rarityPool, isActive, imageUrl } = req.body;
        const pack = await prisma.pack.update({
            where: { id: req.params.id },
            data: { name, description, price, cardCount, rarityPool, isActive, imageUrl },
        });
        return res.json(pack);
    } catch {
        return res.status(404).json({ error: 'Paquete no encontrado' });
    }
});

function weightedRarity(pool: Record<string, number>): string {
    const total = Object.values(pool).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [rarity, weight] of Object.entries(pool)) {
        r -= weight;
        if (r <= 0) return rarity;
    }
    return Object.keys(pool)[0];
}

export default router;
