import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { ValidationError, ensurePositiveInt, ensureString } from '../lib/validation';

const router = Router();

type RarityPool = Record<string, number>;

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ValidationError('price must be a valid number >= 0');
  }
  return parsed;
}

function parseRarityPool(rawPool: unknown): RarityPool {
  const fallback: RarityPool = {
    abundante: 50,
    frecuente: 30,
    rara: 15,
    excepcional: 5,
  };

  if (!rawPool || typeof rawPool !== 'object') return fallback;

  const result: RarityPool = {};
  for (const [key, value] of Object.entries(rawPool as Record<string, unknown>)) {
    const normalizedKey = key.trim();
    const weight = Number(value);
    if (normalizedKey.length > 0 && Number.isFinite(weight) && weight >= 0) {
      result[normalizedKey] = weight;
    }
  }

  return Object.keys(result).length > 0 ? result : fallback;
}

function weightedRarity(pool: RarityPool): string {
  const entries = Object.entries(pool);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0 || entries.length === 0) {
    return 'abundante';
  }

  let random = Math.random() * total;
  for (const [rarity, weight] of entries) {
    random -= weight;
    if (random <= 0) return rarity;
  }

  return entries[0][0];
}

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

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const packId = ensureString(req.params.id, 'id', { maxLength: 100 });
    const pack = await prisma.pack.findUnique({ where: { id: packId } });
    if (!pack) return res.status(404).json({ error: 'Paquete no encontrado' });
    return res.json(pack);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al obtener paquete' });
  }
});

router.post('/:id/open', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const packId = ensureString(req.params.id, 'id', { maxLength: 100 });
    const userId = req.user!.userId;

    const result = await prisma.$transaction(async (tx) => {
      const pack = await tx.pack.findUnique({ where: { id: packId } });
      if (!pack || !pack.isActive) {
        throw new ValidationError('Paquete no disponible', 404);
      }

      const rarityPool = parseRarityPool(pack.rarityPool);
      const wonCardIds: string[] = [];

      for (let i = 0; i < pack.cardCount; i++) {
        const rarity = weightedRarity(rarityPool);
        const candidates = await tx.card.findMany({
          where: { rarity },
          select: { id: true },
          take: 50,
        });

        const pool = candidates.length > 0
          ? candidates
          : await tx.card.findMany({ select: { id: true }, take: 50 });

        if (pool.length === 0) continue;

        const picked = pool[Math.floor(Math.random() * pool.length)];
        wonCardIds.push(picked.id);
      }

      await Promise.all(
        wonCardIds.map((cardId) =>
          tx.userCard.upsert({
            where: { userId_cardId: { userId, cardId } },
            create: { userId, cardId, quantity: 1, source: 'purchased' },
            update: { quantity: { increment: 1 } },
          })
        )
      );

      const purchase = await tx.packPurchase.create({
        data: { userId, packId: pack.id, status: 'completed', cardsWon: wonCardIds },
      });

      const wonCards = await tx.card.findMany({
        where: { id: { in: wonCardIds } },
        select: { id: true, cardId: true, title: true, rarity: true, imageUrl: true, thumbnailPath: true },
      });

      return { purchaseId: purchase.id, wonCards };
    });

    return res.json({ purchase: { id: result.purchaseId }, wonCards: result.wonCards });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Pack open error:', error);
    return res.status(500).json({ error: 'Error al abrir paquete' });
  }
});

router.post('/admin', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const name = ensureString(req.body.name, 'name', { minLength: 2, maxLength: 120 });
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : undefined;
    const price = parseOptionalNumber(req.body.price) ?? 0;
    const cardCount = ensurePositiveInt(req.body.cardCount, 'cardCount', { fallback: 5, min: 1, max: 20 });
    const rarityPool = parseRarityPool(req.body.rarityPool);
    const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : undefined;

    const pack = await prisma.pack.create({
      data: { name, description, price, cardCount, rarityPool, imageUrl },
    });
    return res.status(201).json(pack);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al crear paquete' });
  }
});

router.patch('/admin/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const packId = ensureString(req.params.id, 'id', { maxLength: 100 });
    const updateData: {
      name?: string;
      description?: string;
      price?: number;
      cardCount?: number;
      rarityPool?: RarityPool;
      isActive?: boolean;
      imageUrl?: string;
    } = {};

    if (req.body.name !== undefined) {
      updateData.name = ensureString(req.body.name, 'name', { minLength: 2, maxLength: 120 });
    }
    if (req.body.description !== undefined) {
      updateData.description = String(req.body.description).trim();
    }
    if (req.body.price !== undefined) {
      updateData.price = parseOptionalNumber(req.body.price);
    }
    if (req.body.cardCount !== undefined) {
      updateData.cardCount = ensurePositiveInt(req.body.cardCount, 'cardCount', { min: 1, max: 20 });
    }
    if (req.body.rarityPool !== undefined) {
      updateData.rarityPool = parseRarityPool(req.body.rarityPool);
    }
    if (req.body.isActive !== undefined) {
      updateData.isActive = Boolean(req.body.isActive);
    }
    if (req.body.imageUrl !== undefined) {
      updateData.imageUrl = String(req.body.imageUrl).trim();
    }

    const pack = await prisma.pack.update({
      where: { id: packId },
      data: updateData,
    });
    return res.json(pack);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(404).json({ error: 'Paquete no encontrado' });
  }
});

export default router;
