/**
 * Seed script: imports all cards from birds/pack-1.json into the DB
 * Run with: npm run seed:birds
 *
 * Usage:
 *   cd backend && npx ts-node seeds/seed_birds.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import prisma from '../src/prismaClient';

const PACK_PATH = path.join(__dirname, '../../birds/pack-1.json');

const RARITY_MAP: Record<string, string> = {
  guacamaya_roja: 'abundante',
  'condor-andino': 'rara',
  colibri: 'abundante',
  tucan: 'frecuente',
  buho: 'rara',
  'garza-blanca': 'abundante',
  flamenco: 'rara',
  picozapato: 'excepcional',
  'martin-pescador': 'abundante',
  halcon: 'rara',
  'aguila-harpia': 'excepcional',
  quetzal: 'excepcional',
  'pinguino-humboldt': 'rara',
  'pajaro-campana': 'frecuente',
  'gallito-roca': 'frecuente',
  'loro-orejiamarillo': 'excepcional',
  hoatzin: 'rara',
  'pato-crestudo': 'abundante',
  'tangara-multicolor': 'abundante',
  'carpintero-real': 'rara',
  'espatula-rosada': 'rara',
  'ibis-escarlata': 'frecuente',
  'ciguena-jabiru': 'rara',
  'pelicano-pardo': 'abundante',
  cormoran: 'abundante',
  'fragata-magnificente': 'frecuente',
  'piquero-patas-azules': 'frecuente',
  limpkin: 'abundante',
  paujil: 'rara',
  'perdiz-crestada': 'abundante',
  'paloma-coronita': 'abundante',
  'trogon-enmascarado': 'rara',
  barranquero: 'abundante',
  amazilia: 'abundante',
  'piranga-roja': 'abundante',
  oropendola: 'abundante',
  'siete-colores': 'rara',
  atrapamoscas: 'abundante',
  golondrina: 'abundante',
  'canario-coronado': 'abundante',
};

async function main() {
  console.log('Loading pack from:', PACK_PATH);
  const raw = fs.readFileSync(PACK_PATH, 'utf-8');
  const pack = JSON.parse(raw);
  const assets: Array<{ id: string; title: string; image_url: string; tags?: string[]; atk?: number; def?: number }> = pack.assets || [];

  console.log(`Found ${assets.length} cards. Upserting into DB...`);

  let created = 0;
  let updated = 0;

  for (const asset of assets) {
    const rarity = RARITY_MAP[asset.id] || 'abundante';
    const tags = asset.tags || ['pares', 'kombat'];

    const existing = await prisma.card.findUnique({ where: { cardId: asset.id } });

    if (existing) {
      await prisma.card.update({
        where: { cardId: asset.id },
        data: {
          title: asset.title,
          imageUrl: asset.image_url,
          rarity,
          tags,
          atk: asset.atk || 0,
          def: asset.def || 0,
          packId: 'birds',
        },
      });
      updated++;
    } else {
      await prisma.card.create({
        data: {
          cardId: asset.id,
          title: asset.title,
          imageUrl: asset.image_url,
          rarity,
          tags,
          atk: asset.atk || 0,
          def: asset.def || 0,
          packId: 'birds',
        },
      });
      created++;
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed error:', err);
  prisma.$disconnect();
  process.exit(1);
});
