import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../src/prismaClient';

dotenv.config();

/**
 * Export database tables to JSON files for migration
 * Usage: ts-node scripts/export_sqlite_to_json.ts [--output ./exports]
 */
async function exportToJSON(outputDir: string = './exports') {
  console.log(`📦 Exporting database to JSON`);
  console.log(`   Output directory: ${outputDir}`);
  console.log('');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Export cards
  console.log('📄 Exporting cards...');
  const cards = await prisma.card.findMany();
  const cardsPath = path.join(outputDir, 'cards.json');
  await fs.writeFile(cardsPath, JSON.stringify(cards, null, 2));
  console.log(`   ✓ Exported ${cards.length} cards to ${cardsPath}`);

  // Export presentation rules
  console.log('📄 Exporting presentation rules...');
  const presentationRules = await prisma.presentationRule.findMany();
  const rulesPath = path.join(outputDir, 'presentation_rules.json');
  await fs.writeFile(rulesPath, JSON.stringify(presentationRules, null, 2));
  console.log(`   ✓ Exported ${presentationRules.length} presentation rules to ${rulesPath}`);

  // Export assets
  console.log('📄 Exporting assets...');
  const assets = await prisma.asset.findMany();
  const assetsPath = path.join(outputDir, 'assets.json');
  await fs.writeFile(assetsPath, JSON.stringify(assets, null, 2));
  console.log(`   ✓ Exported ${assets.length} assets to ${assetsPath}`);

  // Export audit logs (optional, can be large)
  console.log('📄 Exporting audit logs...');
  const auditLogs = await prisma.auditLog.findMany({
    take: 1000, // Limit to last 1000 logs
    orderBy: { createdAt: 'desc' },
  });
  const logsPath = path.join(outputDir, 'audit_logs.json');
  await fs.writeFile(logsPath, JSON.stringify(auditLogs, null, 2));
  console.log(`   ✓ Exported ${auditLogs.length} audit logs (last 1000) to ${logsPath}`);

  // Create a summary file
  const summary = {
    exportedAt: new Date().toISOString(),
    counts: {
      cards: cards.length,
      presentationRules: presentationRules.length,
      assets: assets.length,
      auditLogs: auditLogs.length,
    },
  };
  const summaryPath = path.join(outputDir, 'export_summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`   ✓ Export summary written to ${summaryPath}`);

  console.log('\n✅ Export complete!');
}

// Parse command line arguments
const args = process.argv.slice(2);
let outputDir = './exports';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--output':
      outputDir = args[++i];
      break;
    case '--help':
      console.log(`
Usage: npm run export:json -- [--output <directory>]

Options:
  --output <directory>  Output directory for JSON files (default: ./exports)
  --help                Show this help message

Examples:
  npm run export:json
  npm run export:json -- --output ./migration-data
      `);
      process.exit(0);
  }
}

// Run the script
exportToJSON(outputDir)
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
