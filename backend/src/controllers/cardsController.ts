import { Request, Response, NextFunction } from 'express';
import prisma from '../prismaClient';
import { enqueueCardUpdate } from '../queue';

/**
 * Middleware to validate admin key
 */
export function validateAdminKey(req: Request, res: Response, next: NextFunction): void {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey) {
    res.status(500).json({ error: 'Admin key not configured on server' });
    return;
  }

  if (!adminKey || adminKey !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid admin key' });
    return;
  }

  next();
}

/**
 * PATCH /api/admin/cards/:id
 * Update card properties (especially rarity)
 */
export async function patchCard(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rarity, rarityV2, title, metadata } = req.body;

    // Find the card
    const card = await prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Prepare update data
    const updateData: any = {};
    const changes: Record<string, any> = {};

    if (rarity !== undefined) {
      updateData.rarity = rarity;
      changes.rarity = { old: card.rarity, new: rarity };
    }

    if (rarityV2 !== undefined) {
      updateData.rarityV2 = rarityV2;
      changes.rarityV2 = { old: card.rarityV2, new: rarityV2 };
    }

    if (title !== undefined) {
      updateData.title = title;
      changes.title = { old: card.title, new: title };
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata;
      changes.metadata = { old: card.metadata, new: metadata };
    }

    // Update the card
    const updatedCard = await prisma.card.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        cardId: id,
        action: 'update_card',
        performedBy: 'admin', // In production, use actual admin user ID
        changes,
        metadata: {
          timestamp: new Date().toISOString(),
          ip: req.ip,
        },
      },
    });

    // Enqueue thumbnail regeneration if rarity changed
    if (rarity !== undefined || rarityV2 !== undefined) {
      await enqueueCardUpdate({
        cardId: updatedCard.cardId,
        action: 'regenerate_thumbnail',
        metadata: {
          oldRarity: card.rarity,
          newRarity: updatedCard.rarity,
          trigger: 'admin_update',
        },
      });
    }

    return res.json({
      success: true,
      card: updatedCard,
      message: 'Card updated successfully',
    });
  } catch (error) {
    console.error('Error updating card:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/cards/:id/presentation
 * Get card with presentation rules (public endpoint)
 */
export async function getCardPresentation(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Find card by cardId (the unique identifier like "guacamaya-roja")
    const card = await prisma.card.findUnique({
      where: { cardId: id },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get presentation rule for this rarity
    const presentationRule = await prisma.presentationRule.findUnique({
      where: { rarity: card.rarity },
    });

    return res.json({
      card,
      presentation: presentationRule || {
        frameColor: '#CCCCCC',
        glowEffect: false,
        badgeIcon: null,
      },
    });
  } catch (error) {
    console.error('Error fetching card presentation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
