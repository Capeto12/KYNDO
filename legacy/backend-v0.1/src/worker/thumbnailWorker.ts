import dotenv from "dotenv";
dotenv.config();
import { cardQueue } from "../queue";
import prisma from "../prismaClient";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "uploads";
const THUMBS_DIR = path.join(UPLOADS_DIR, "thumbnails");

async function ensureDirs() {
  await fs.mkdir(THUMBS_DIR, { recursive: true });
}

async function regenerateThumbnail(cardId: string, assetPath?: string) {
  if (!assetPath) return null;
  await ensureDirs();
  const src = assetPath;
  const dst = path.join(THUMBS_DIR, `${cardId}.webp`);
  try {
    await sharp(src).resize(512, 512, { fit: "cover" }).webp({ quality: 80 }).toFile(dst);
    return dst;
  } catch (err) {
    console.error("thumbnail generation failed:", err);
    return null;
  }
}

cardQueue.process("card.updated", async (job) => {
  const { cardId, changes } = job.data;
  console.log("Processing card.updated", cardId, changes);
  try {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error("card not found in worker");

    // regenerate thumbnail
    const thumbnailPath = await regenerateThumbnail(cardId, card.assetPath ?? undefined);
    if (thumbnailPath) {
      await prisma.card.update({ where: { id: cardId }, data: { thumbnailPath } });
    }

    // Simulate CDN purge / cache invalidation
    console.log(`Purge cache / CDN for card ${cardId} (thumbnail ${thumbnailPath})`);
    // TODO: call actual CDN API (Cloudflare/CloudFront) here.

    return Promise.resolve();
  } catch (err) {
    console.error("Worker error", err);
    throw err;
  }
});

console.log("Thumbnail worker started.");
