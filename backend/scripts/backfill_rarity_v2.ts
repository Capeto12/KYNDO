import dotenv from 'dotenv';
import prisma from '../src/prismaClient';
import { enqueueCardUpdate } from '../src/queue';

dotenv.config();

/**
 * Backfill rarity_v2 field for all cards
 * This script is idempotent and can be run multiple times safely
 * Usage: ts-node scripts/backfill_rarity_v2.ts [--execute]
 */
async function backfillRarityV2(dryRun: boolean = true) {
  console.log(`🔧 Backfill rarity_v2 field`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log('');

  // Find cards where rarity_v2 is null
  const cardsToUpdate = await prisma.card.findMany({
    where: {
      rarityV2: null,
    },
    select: {
      id: true,
      cardId: true,
      title: true,
      rarity: true,
    },
  });

  console.log(`📊 Found ${cardsToUpdate.length} cards to backfill`);

  if (cardsToUpdate.length === 0) {
    console.log('✓ All cards already have rarity_v2 set');
    return;
  }

  if (dryRun) {
    console.log('\n📋 Sample cards that would be updated:');
    cardsToUpdate.slice(0, 5).forEach((card) => {
      console.log(`   - ${card.cardId}: ${card.title} (rarity: ${card.rarity} → rarity_v2: ${card.rarity})`);
    });
    if (cardsToUpdate.length > 5) {
      console.log(`   ... and ${cardsToUpdate.length - 5} more`);
    }
    console.log('\n✓ Dry run complete. Use --execute to perform the backfill.');
    return;
  }

  // Execute backfill in batches of 100
  const batchSize = 100;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < cardsToUpdate.length; i += batchSize) {
    const batch = cardsToUpdate.slice(i, i + batchSize);
    console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cardsToUpdate.length / batchSize)}...`);

    for (const card of batch) {
      try {
        // Update rarity_v2 to match rarity
        await prisma.card.update({
          where: { id: card.id },
          data: { rarityV2: card.rarity },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            cardId: card.id,
            action: 'backfill_rarity_v2',
            performedBy: 'script',
            changes: {
              rarityV2: { old: null, new: card.rarity },
            },
            metadata: {
              sourceRarity: card.rarity,
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Optionally enqueue thumbnail regeneration
        // Uncomment if you want to regenerate thumbnails during backfill
        /*
        await enqueueCardUpdate({
          cardId: card.cardId,
          action: 'regenerate_thumbnail',
          metadata: {
            trigger: 'backfill_rarity_v2',
          },
        });
        */

        updated++;
        console.log(`   ✓ ${updated}/${cardsToUpdate.length}: ${card.cardId} backfilled`);
      } catch (error) {
        failed++;
        console.error(`   ✗ Failed to backfill ${card.cardId}:`, error);
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✓ Successfully backfilled: ${updated}`);
  console.log(`   ✗ Failed: ${failed}`);
  console.log('\n✅ Backfill complete!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

if (args.includes('--help')) {
  console.log(`
Usage: npm run backfill -- [--execute]

Options:
  --execute     Execute the backfill (default: dry run)
  --help        Show this help message

Examples:
  npm run backfill              # Dry run
  npm run backfill -- --execute # Execute backfill
  `);
  process.exit(0);
}

// Run the script
backfillRarityV2(dryRun)
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
