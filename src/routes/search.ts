import { Router } from "express";
import prisma from "../prismaClient";

const router = Router();

/**
 * GET /api/search
 * Search cards by title or description
 * Query params:
 *   - q: search term (required)
 *   - limit: max results (optional, default: 20, max: 100)
 */
router.get("/", async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    const limit = Math.min(
      parseInt(req.query.limit as string) || 20,
      100
    );

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({
        error: "Search term 'q' is required",
      });
    }

    // Search cards by title (case-insensitive partial match)
    const cards = await prisma.card.findMany({
      where: {
        OR: [
          {
            title: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        rarity: true,
        assetPath: true,
        thumbnailPath: true,
        objectId: true,
      },
      take: limit,
      orderBy: [
        { title: "asc" },
      ],
    });

    return res.json({
      query: searchTerm,
      count: cards.length,
      results: cards,
    });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({
      error: "Internal server error during search",
    });
  }
});

export default router;
