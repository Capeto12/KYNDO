import dotenv from 'dotenv';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { getCardUpdateQueue, CardUpdateJob } from '../queue';
import prisma from '../prismaClient';

// Load environment variables
dotenv.config();

const queue = getCardUpdateQueue();
const THUMBNAILS_DIR = process.env.THUMBNAILS_DIR || './uploads/thumbnails';

/**
 * Process card update jobs
 */
queue.process(async (job) => {
  const data: CardUpdateJob = job.data;
  console.log(`Processing job ${job.id}: ${data.action} for card ${data.cardId}`);

  try {
    switch (data.action) {
      case 'regenerate_thumbnail':
        await regenerateThumbnail(data.cardId, data.metadata);
        break;
      case 'update_rarity':
        await updateCardRarity(data.cardId, data.metadata);
        break;
      default:
        throw new Error(`Unknown action: ${data.action}`);
    }

    console.log(`✓ Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`✗ Job ${job.id} failed:`, error);
    throw error; // Re-throw to mark job as failed
  }
});

/**
 * Regenerate thumbnail for a card
 */
async function regenerateThumbnail(cardId: string, metadata?: any) {
  // Find the card
  const card = await prisma.card.findUnique({
    where: { cardId },
  });

  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  if (!card.imageUrl) {
    console.log(`Skipping thumbnail generation for ${cardId}: no image URL`);
    return;
  }

  // Ensure thumbnails directory exists
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });

  // Construct paths
  const imagePath = path.join(process.cwd(), '..', card.imageUrl);
  const thumbnailFilename = `${cardId}-thumb.webp`;
  const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

  try {
    // Check if source image exists
    await fs.access(imagePath);

    // Generate thumbnail using sharp
    await sharp(imagePath)
      .resize(300, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(thumbnailPath);

    // Update card with thumbnail path
    const relativeThumbnailPath = path.relative(process.cwd(), thumbnailPath);
    await prisma.card.update({
      where: { cardId },
      data: { thumbnailPath: relativeThumbnailPath },
    });

    // Create asset record
    const stats = await fs.stat(thumbnailPath);
    await prisma.asset.create({
      data: {
        assetKey: `thumbnails/${thumbnailFilename}`,
        assetType: 'thumbnail',
        filePath: relativeThumbnailPath,
        fileSize: stats.size,
        mimeType: 'image/webp',
        generatedBy: 'sharp',
        metadata: {
          sourceImage: card.imageUrl,
          dimensions: { width: 300, height: 400 },
          quality: 85,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        cardId: card.id,
        action: 'regenerate_thumbnail',
        performedBy: 'worker',
        metadata: {
          thumbnailPath: relativeThumbnailPath,
          trigger: metadata?.trigger || 'manual',
        },
      },
    });

    console.log(`✓ Thumbnail generated for ${cardId}: ${relativeThumbnailPath}`);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      console.error(`Source image not found: ${imagePath}`);
    }
    throw error;
  }
}

/**
 * Update card rarity
 */
async function updateCardRarity(cardId: string, metadata?: any) {
  const { newRarity } = metadata || {};

  if (!newRarity) {
    throw new Error('newRarity not provided in metadata');
  }

  await prisma.card.update({
    where: { cardId },
    data: { rarity: newRarity },
  });

  await prisma.auditLog.create({
    data: {
      cardId,
      action: 'update_rarity',
      performedBy: 'worker',
      metadata,
    },
  });

  console.log(`✓ Updated rarity for ${cardId} to ${newRarity}`);
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker gracefully...');
  await queue.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker gracefully...');
  await queue.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('🔧 Thumbnail worker started');
console.log('📦 Waiting for jobs...');
