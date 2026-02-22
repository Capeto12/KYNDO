import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';

const router = Router();

/**
 * GET /api/search
 * Search cards by title or description
 * Query params:
 *   - q: search term (required)
 *   - limit: max results (optional, default: 20, max: 100)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.q as string || '';
    const tagsParam = req.query.tags as string;
    const limit = Math.min(
      parseInt(req.query.limit as string) || 20,
      100
    );

    // Build the query
    const whereClause: any = {};

    if (searchTerm.trim() !== '') {
      whereClause.OR = [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (tagsParam) {
      // Tags comma-separated, e.g., ?tags=pares,kombat
      const searchTags = tagsParam.split(',').map(t => t.trim());
      whereClause.tags = {
        hasSome: searchTags
      };
    }

    // Search cards
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
      orderBy: [
        { title: 'asc' },
      ],
    });

    return res.json({
      query: searchTerm,
      count: cards.length,
      results: cards,
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({
      error: 'Internal server error during search',
    });
  }
});

export default router;
