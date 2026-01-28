import { Request, Response } from "express";
import prisma from "../prismaClient";
import { enqueueCardUpdate } from "../queue";

const ADMIN_KEY = process.env.ADMIN_KEY || "admin_dev_key";

export async function patchCard(req: Request, res: Response) {
  try {
    const adminKey = req.header("x-admin-key");
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: "forbidden" });
    }

    const cardId = req.params.id;
    const { rarity, metadata } = req.body;

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return res.status(404).json({ error: "card not found" });

    const before = { rarity: card.rarity, metadata: card.metadata };

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        rarity: rarity ?? card.rarity,
        metadata: metadata ? JSON.parse(metadata) : card.metadata,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminKey,
        action: "card:update",
        targetType: "card",
        targetId: cardId,
        before: before,
        after: { rarity: updated.rarity, metadata: updated.metadata },
      },
    });

    // Enqueue job to regenerate derived assets (thumbnails) and purge cache
    const job = await enqueueCardUpdate({
      cardId,
      changes: { from: before.rarity, to: updated.rarity },
      actor: adminKey,
      timestamp: new Date().toISOString(),
    });

    return res.json({ ok: true, card: updated, jobId: job.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal" });
  }
}
