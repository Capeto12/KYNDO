import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../prismaClient';
import { ValidationError, ensurePositiveInt, ensureString, parseCsvParam } from '../lib/validation';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.q ? ensureString(req.query.q, 'q', { maxLength: 120, optional: true }) : '';
    const tags = parseCsvParam(req.query.tags);
    const limit = ensurePositiveInt(req.query.limit, 'limit', { fallback: 20, min: 1, max: 100 });

    const whereClause: Prisma.CardWhereInput = {};

    if (searchTerm !== '') {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (tags.length > 0) {
      whereClause.tags = { hasSome: tags };
    }

    const cards = await prisma.card.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      select: {
        id: true,
        cardId: true,
        title: true,
        description: true,
        rarity: true,
        imageUrl: true,
        thumbnailPath: true,
        packId: true,
      },
      take: limit,
      orderBy: [{ title: 'asc' }],
    });

    return res.json({
      query: searchTerm,
      count: cards.length,
      results: cards,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal server error during search' });
  }
});

export default router;
