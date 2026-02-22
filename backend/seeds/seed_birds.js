const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PACK_PATH = path.join(__dirname, '../../birds/pack-1.json');

const RARITY_MAP = {
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
    try {
        console.log('Current __dirname:', __dirname);
        console.log('Absolute PACK_PATH:', path.resolve(PACK_PATH));

        if (!fs.existsSync(PACK_PATH)) {
            throw new Error(`File not found: ${PACK_PATH}`);
        }

        let raw = fs.readFileSync(PACK_PATH, 'utf-8');
        // Strip BOM if present
        if (raw.charCodeAt(0) === 0xFEFF) {
            raw = raw.slice(1);
        }
        const pack = JSON.parse(raw);
        const assets = pack.assets || [];

        console.log(`Found ${assets.length} cards. Upserting into DB...`);

        let created = 0;
        let updated = 0;

        for (const asset of assets) {
            const rarity = RARITY_MAP[asset.id] || 'abundante';
            const tags = asset.tags || ['pares', 'kombat'];

            const birdData = {
                title: asset.title,
                description: asset.description || '',
                imageUrl: asset.image_url,
                rarity,
                tags,
                atk: asset.atk || 0,
                def: asset.def || 0,
                packId: 'birds'
            };

            try {
                await prisma.card.upsert({
                    where: { cardId: asset.id },
                    update: birdData,
                    create: {
                        ...birdData,
                        cardId: asset.id
                    }
                });
                updated++;
                if (updated % 10 === 0) console.log(`Processed ${updated}...`);
            } catch (err) {
                console.error(`Error upserting ${asset.id}:`, err.message);
            }
        }

        console.log(`Done. Processed: ${updated}`);
    } catch (err) {
        console.error('CRITICAL ERROR in main:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
