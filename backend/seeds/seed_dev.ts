import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../src/prismaClient';

dotenv.config();

interface SeedCard {
  cardId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  rarity: string;
  packId: string;
  metadata?: any;
}

interface PackData {
  packId: string;
  title: string;
  version: number;
  count: number;
  cards: SeedCard[];
}

/**
 * Seed development database with sample data
 * Usage: ts-node seeds/seed_dev.ts
 */
async function seedDatabase() {
  console.log('🌱 Seeding development database...\n');

  // Load pack-1.json
  const packPath = path.join(__dirname, 'pack-1.json');
  const packContent = await fs.readFile(packPath, 'utf-8');
  const packData: PackData = JSON.parse(packContent);

  console.log(`📦 Loading pack: ${packData.title} (${packData.cards.length} cards)`);

  // Insert cards
  let cardsCreated = 0;
  let cardsSkipped = 0;

  for (const cardData of packData.cards) {
    try {
      // Check if card already exists
      const existing = await prisma.card.findUnique({
        where: { cardId: cardData.cardId },
      });

      if (existing) {
        console.log(`   ⏭️  Skipped: ${cardData.cardId} (already exists)`);
        cardsSkipped++;
        continue;
      }

      // Create card
      await prisma.card.create({
        data: {
          cardId: cardData.cardId,
          title: cardData.title,
          description: cardData.description,
          imageUrl: cardData.imageUrl,
          rarity: cardData.rarity,
          packId: cardData.packId,
          metadata: cardData.metadata,
        },
      });

      console.log(`   ✓ Created: ${cardData.cardId} (${cardData.rarity})`);
      cardsCreated++;
    } catch (error) {
      console.error(`   ✗ Failed to create ${cardData.cardId}:`, error);
    }
  }

  console.log(`\n📊 Cards: ${cardsCreated} created, ${cardsSkipped} skipped`);

  // Create presentation rules
  console.log('\n🎨 Creating presentation rules...');
  
  const presentationRules = [
    {
      rarity: 'common',
      frameColor: '#CCCCCC',
      glowEffect: false,
      badgeIcon: null,
      sortOrder: 1,
      metadata: { description: 'Common cards - basic gray frame' },
    },
    {
      rarity: 'rare',
      frameColor: '#4A90E2',
      glowEffect: true,
      badgeIcon: '⭐',
      sortOrder: 2,
      metadata: { description: 'Rare cards - blue frame with glow' },
    },
    {
      rarity: 'epic',
      frameColor: '#9B59B6',
      glowEffect: true,
      badgeIcon: '💎',
      sortOrder: 3,
      metadata: { description: 'Epic cards - purple frame with glow' },
    },
    {
      rarity: 'legendary',
      frameColor: '#F39C12',
      glowEffect: true,
      badgeIcon: '👑',
      sortOrder: 4,
      metadata: { description: 'Legendary cards - gold frame with glow' },
    },
  ];

  let rulesCreated = 0;
  let rulesSkipped = 0;

  for (const rule of presentationRules) {
    try {
      const existing = await prisma.presentationRule.findUnique({
        where: { rarity: rule.rarity },
      });

      if (existing) {
        console.log(`   ⏭️  Skipped: ${rule.rarity} rule (already exists)`);
        rulesSkipped++;
        continue;
      }

      await prisma.presentationRule.create({
        data: rule,
      });

      console.log(`   ✓ Created: ${rule.rarity} presentation rule`);
      rulesCreated++;
    } catch (error) {
      console.error(`   ✗ Failed to create ${rule.rarity} rule:`, error);
    }
  }

  console.log(`\n📊 Presentation Rules: ${rulesCreated} created, ${rulesSkipped} skipped`);

  // Create initial audit log
  console.log('\n📝 Creating initial audit log...');
  await prisma.auditLog.create({
    data: {
      action: 'database_seed',
      performedBy: 'seed_script',
      metadata: {
        cardsCreated,
        cardsSkipped,
        rulesCreated,
        rulesSkipped,
        packId: packData.packId,
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('   ✓ Audit log created');

  console.log('\n✅ Database seeding complete!');
  console.log('\n📝 Notes:');
  console.log('   - Admin access uses ADMIN_KEY environment variable');
  console.log('   - Set ADMIN_KEY in .env for admin endpoints');
  console.log('   - Default admin key: "dev-admin-key-change-in-production"');
  console.log('   - Use x-admin-key header for admin API requests');
}

// Run the seed script
seedDatabase()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
