import dotenv from 'dotenv';
import prisma from '../src/prismaClient';
import { enqueueCardUpdate } from '../src/queue';

dotenv.config();

interface BulkPromoteOptions {
  fromRarity: string;
  toRarity: string;
  batchSize?: number;
  dryRun?: boolean;
}

/**
 * Bulk promote cards from one rarity to another
 * Usage: ts-node scripts/bulk_promote.ts --from common --to rare [--dry-run] [--batch-size 50]
 */
async function bulkPromote(options: BulkPromoteOptions) {
  const { fromRarity, toRarity, batchSize = 50, dryRun = false } = options;

  console.log(`🔧 Bulk Promote Cards`);
  console.log(`   From: ${fromRarity} → To: ${toRarity}`);
  console.log(`   Batch size: ${batchSize}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log('');

  // Count total cards to promote
  const totalCards = await prisma.card.count({
    where: { rarity: fromRarity },
  });

  console.log(`📊 Found ${totalCards} cards with rarity "${fromRarity}"`);

  if (totalCards === 0) {
    console.log('✓ No cards to promote');
    return;
  }

  if (dryRun) {
    const sampleCards = await prisma.card.findMany({
      where: { rarity: fromRarity },
      take: 5,
      select: { cardId: true, title: true, rarity: true },
    });

    console.log('\n📋 Sample cards that would be promoted:');
    sampleCards.forEach((card) => {
      console.log(`   - ${card.cardId}: ${card.title} (${card.rarity})`);
    });
    console.log(`   ... and ${totalCards - sampleCards.length} more`);
    console.log('\n✓ Dry run complete. Use --execute to perform the promotion.');
    return;
  }

  // Process in batches
  let processed = 0;
  let failed = 0;

  while (processed < totalCards) {
    const batch = await prisma.card.findMany({
      where: { rarity: fromRarity },
      take: batchSize,
      skip: processed,
    });

    console.log(`\n🔄 Processing batch ${Math.floor(processed / batchSize) + 1}...`);

    for (const card of batch) {
      try {
        // Update card rarity
        await prisma.card.update({
          where: { id: card.id },
          data: { rarity: toRarity },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            cardId: card.id,
            action: 'bulk_promote_rarity',
            performedBy: 'script',
            changes: {
              rarity: { old: fromRarity, new: toRarity },
            },
            metadata: {
              batchIndex: Math.floor(processed / batchSize),
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Enqueue thumbnail regeneration
        await enqueueCardUpdate({
          cardId: card.cardId,
          action: 'regenerate_thumbnail',
          metadata: {
            oldRarity: fromRarity,
            newRarity: toRarity,
            trigger: 'bulk_promote',
          },
        });

        processed++;
        console.log(`   ✓ ${processed}/${totalCards}: ${card.cardId} promoted`);
      } catch (error) {
        failed++;
        console.error(`   ✗ Failed to promote ${card.cardId}:`, error);
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✓ Successfully promoted: ${processed - failed}`);
  console.log(`   ✗ Failed: ${failed}`);
  console.log(`   📦 Jobs enqueued: ${processed - failed}`);
  console.log('\n✅ Bulk promotion complete!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: BulkPromoteOptions = {
  fromRarity: '',
  toRarity: '',
  batchSize: 50,
  dryRun: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--from':
      options.fromRarity = args[++i];
      break;
    case '--to':
      options.toRarity = args[++i];
      break;
    case '--batch-size':
      options.batchSize = parseInt(args[++i], 10);
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--execute':
      options.dryRun = false;
      break;
    case '--help':
      console.log(`
Usage: npm run bulk:promote -- --from <rarity> --to <rarity> [options]

Options:
  --from <rarity>       Source rarity (required)
  --to <rarity>         Target rarity (required)
  --batch-size <n>      Number of cards to process per batch (default: 50)
  --dry-run             Preview changes without executing (default)
  --execute             Execute the promotion
  --help                Show this help message

Examples:
  npm run bulk:promote -- --from common --to rare --dry-run
  npm run bulk:promote -- --from rare --to epic --execute --batch-size 100
      `);
      process.exit(0);
  }
}

// Validate options
if (!options.fromRarity || !options.toRarity) {
  console.error('❌ Error: --from and --to are required');
  console.log('Run with --help for usage information');
  process.exit(1);
}

// Run the script
bulkPromote(options)
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
