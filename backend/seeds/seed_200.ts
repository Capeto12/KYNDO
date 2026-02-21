import dotenv from 'dotenv';
import prisma from '../src/prismaClient';

dotenv.config();

// ── 160 extra test birds to reach 200 total ───────────────────────────
const EXTRA_BIRDS = [
    // Rarity weights: abundante ~50%, frecuente ~30%, rara ~15%, excepcional ~5%
    { id: 'aguila-real', name: 'Águila Real', sci: 'Aquila chrysaetos', habitat: 'Mountains', rarity: 'rara' },
    { id: 'anade-real', name: 'Ánade Real', sci: 'Anas platyrhynchos', habitat: 'Wetlands', rarity: 'abundante' },
    { id: 'avestruz', name: 'Avestruz', sci: 'Struthio camelus', habitat: 'Savannah', rarity: 'frecuente' },
    { id: 'buitre-leonado', name: 'Buitre Leonado', sci: 'Gyps fulvus', habitat: 'Rocky cliffs', rarity: 'frecuente' },
    { id: 'calandria', name: 'Calandria', sci: 'Mimus saturninus', habitat: 'Open areas', rarity: 'abundante' },
    { id: 'caprimulgo', name: 'Caprimulgo', sci: 'Caprimulgus europaeus', habitat: 'Heathlands', rarity: 'frecuente' },
    { id: 'cartacuba', name: 'Cartacuba', sci: 'Todus multicolor', habitat: 'Forest edges', rarity: 'rara' },
    { id: 'cigueña-blanca', name: 'Cigüeña Blanca', sci: 'Ciconia ciconia', habitat: 'Wetlands', rarity: 'frecuente' },
    { id: 'colimbo', name: 'Colimbo', sci: 'Gavia immer', habitat: 'Lakes', rarity: 'rara' },
    { id: 'cotinga-glauca', name: 'Cotinga Glauca', sci: 'Cotinga cotinga', habitat: 'Rainforest', rarity: 'excepcional' },
    { id: 'cucú', name: 'Cucú', sci: 'Cuculus canorus', habitat: 'Woodlands', rarity: 'abundante' },
    { id: 'curruca', name: 'Curruca', sci: 'Sylvia atricapilla', habitat: 'Gardens', rarity: 'abundante' },
    { id: 'charrán-ártico', name: 'Charrán Ártico', sci: 'Sterna paradisaea', habitat: 'Coasts', rarity: 'rara' },
    { id: 'chochín', name: 'Chochín', sci: 'Troglodytes troglodytes', habitat: 'Dense shrubs', rarity: 'abundante' },
    { id: 'dodo', name: 'Dodo', sci: 'Raphus cucullatus', habitat: 'Island forests', rarity: 'excepcional' },
    { id: 'drongo-real', name: 'Drongo Real', sci: 'Dicrurus macrocercus', habitat: 'Open forests', rarity: 'frecuente' },
    { id: 'emú', name: 'Emú', sci: 'Dromaius novaehollandiae', habitat: 'Savannah', rarity: 'frecuente' },
    { id: 'estornino-pinto', name: 'Estornino Pinto', sci: 'Sturnus vulgaris', habitat: 'Urban areas', rarity: 'abundante' },
    { id: 'focha-común', name: 'Focha Común', sci: 'Fulica atra', habitat: 'Lakes', rarity: 'abundante' },
    { id: 'fumarel-común', name: 'Fumarel Común', sci: 'Chlidonias niger', habitat: 'Wetlands', rarity: 'frecuente' },
    { id: 'gallo-lira', name: 'Gallo Lira', sci: 'Tetrao tetrix', habitat: 'Moorland', rarity: 'rara' },
    { id: 'gavilán-común', name: 'Gavilán Común', sci: 'Accipiter nisus', habitat: 'Woodlands', rarity: 'frecuente' },
    { id: 'golondrina-dáurica', name: 'Golondrina Dáurica', sci: 'Cecropis daurica', habitat: 'Open country', rarity: 'frecuente' },
    { id: 'grulla-común', name: 'Grulla Común', sci: 'Grus grus', habitat: 'Wetlands', rarity: 'rara' },
    { id: 'guacamayo-azul', name: 'Guacamayo Azul', sci: 'Anodorhynchus hyacinthinus', habitat: 'Palm forests', rarity: 'excepcional' },
    { id: 'ibis-sagrado', name: 'Ibis Sagrado', sci: 'Threskiornis aethiopicus', habitat: 'Wetlands', rarity: 'frecuente' },
    { id: 'jilguero', name: 'Jilguero', sci: 'Carduelis carduelis', habitat: 'Gardens', rarity: 'abundante' },
    { id: 'kakapo', name: 'Kākāpō', sci: 'Strigops habroptilus', habitat: 'Forest', rarity: 'excepcional' },
    { id: 'kiwi', name: 'Kiwi', sci: 'Apteryx mantelli', habitat: 'Forests', rarity: 'excepcional' },
    { id: 'lavandera-blanca', name: 'Lavandera Blanca', sci: 'Motacilla alba', habitat: 'Urban areas', rarity: 'abundante' },
    { id: 'lechuza-campanario', name: 'Lechuza de Campanario', sci: 'Tyto alba', habitat: 'Farmland', rarity: 'frecuente' },
    { id: 'loro-gris-africano', name: 'Loro Gris Africano', sci: 'Psittacus erithacus', habitat: 'Rainforest', rarity: 'rara' },
    { id: 'malurido-magnífico', name: 'Malurido Magnífico', sci: 'Malurus splendens', habitat: 'Scrublands', rarity: 'frecuente' },
    { id: 'martín-gigante', name: 'Martín Gigante', sci: 'Ceryle maxima', habitat: 'Rivers', rarity: 'rara' },
    { id: 'marabu', name: 'Marabú', sci: 'Leptoptilos crumenifer', habitat: 'Savannah', rarity: 'frecuente' },
    { id: 'mergo-serrano', name: 'Mergo Serrano', sci: 'Mergus merganser', habitat: 'Rivers', rarity: 'frecuente' },
    { id: 'milano-negro', name: 'Milano Negro', sci: 'Milvus migrans', habitat: 'Open woodland', rarity: 'frecuente' },
    { id: 'mirlo-acuático', name: 'Mirlo Acuático', sci: 'Cinclus cinclus', habitat: 'Mountain streams', rarity: 'frecuente' },
    { id: 'mirlo-común', name: 'Mirlo Común', sci: 'Turdus merula', habitat: 'Gardens', rarity: 'abundante' },
    { id: 'mochuelo-europeo', name: 'Mochuelo Europeo', sci: 'Athene noctua', habitat: 'Open country', rarity: 'frecuente' },
    { id: 'monjita-dominicana', name: 'Monjita Dominicana', sci: 'Xolmis dominicanus', habitat: 'Grasslands', rarity: 'rara' },
    { id: 'mosquitero-musical', name: 'Mosquitero Musical', sci: 'Phylloscopus trochilus', habitat: 'Woodlands', rarity: 'abundante' },
    { id: 'nandú', name: 'Ñandú', sci: 'Rhea americana', habitat: 'Pampas', rarity: 'frecuente' },
    { id: 'paloma-torcaz', name: 'Paloma Torcaz', sci: 'Columba palumbus', habitat: 'Woodlands', rarity: 'abundante' },
    { id: 'papamoscas-gris', name: 'Papamoscas Gris', sci: 'Muscicapa striata', habitat: 'Gardens', rarity: 'abundante' },
    { id: 'pato-friso', name: 'Pato Friso', sci: 'Mareca strepera', habitat: 'Lakes', rarity: 'frecuente' },
    { id: 'pato-colorado', name: 'Pato Colorado', sci: 'Netta rufina', habitat: 'Lakes', rarity: 'frecuente' },
    { id: 'periquito-australiano', name: 'Periquito Australiano', sci: 'Melopsittacus undulatus', habitat: 'Arid scrub', rarity: 'abundante' },
    { id: 'petrel-gigante', name: 'Petrel Gigante', sci: 'Macronectes giganteus', habitat: 'Open ocean', rarity: 'rara' },
    { id: 'pico-gordo', name: 'Picogordo', sci: 'Coccothraustes coccothraustes', habitat: 'Deciduous forests', rarity: 'frecuente' },
    { id: 'picocruz-común', name: 'Picocruz Común', sci: 'Loxia curvirostra', habitat: 'Coniferous forests', rarity: 'frecuente' },
    { id: 'pintada', name: 'Pintada', sci: 'Numida meleagris', habitat: 'Savannah', rarity: 'abundante' },
    { id: 'piquero-pardo', name: 'Piquero Pardo', sci: 'Sula leucogaster', habitat: 'Tropical coasts', rarity: 'frecuente' },
    { id: 'pombo-de-nicobar', name: 'Paloma de Nicobar', sci: 'Caloenas nicobarica', habitat: 'Islands', rarity: 'rara' },
    { id: 'polluela-bastarda', name: 'Polluela Bastarda', sci: 'Porzana porzana', habitat: 'Reed beds', rarity: 'frecuente' },
    { id: 'pio-de-campo', name: 'Pío de Campo', sci: 'Zonotrichia capensis', habitat: 'Grasslands', rarity: 'abundante' },
    { id: 'reyezuelo-sencillo', name: 'Reyezuelo Sencillo', sci: 'Regulus regulus', habitat: 'Conifer forests', rarity: 'abundante' },
    { id: 'roca-saltador', name: 'Roquero Solitario', sci: 'Monticola solitarius', habitat: 'Rocky coasts', rarity: 'frecuente' },
    { id: 'serín-verdecillo', name: 'Serín Verdecillo', sci: 'Serinus serinus', habitat: 'Open country', rarity: 'abundante' },
    { id: 'sisón-común', name: 'Sisón Común', sci: 'Tetrax tetrax', habitat: 'Grasslands', rarity: 'rara' },
    { id: 'tarro-blanco', name: 'Tarro Blanco', sci: 'Tadorna tadorna', habitat: 'Estuaries', rarity: 'frecuente' },
    { id: 'tarro-canelo', name: 'Tarro Canelo', sci: 'Tadorna ferruginea', habitat: 'Lakes', rarity: 'frecuente' },
    { id: 'tejedor-mascherin', name: 'Tejedor', sci: 'Ploceus cucullatus', habitat: 'Open woodland', rarity: 'frecuente' },
    { id: 'terrera-común', name: 'Terrera Común', sci: 'Calandrella brachydactyla', habitat: 'Dry grasslands', rarity: 'abundante' },
    { id: 'tordo-musical', name: 'Tordo Musical', sci: 'Turdus philomelos', habitat: 'Woodlands', rarity: 'abundante' },
    { id: 'treparriscos', name: 'Treparriscos', sci: 'Tichodroma muraria', habitat: 'Mountain cliffs', rarity: 'rara' },
    { id: 'triguero', name: 'Triguero', sci: 'Emberiza calandra', habitat: 'Farmland', rarity: 'abundante' },
    { id: 'turnix-mugidora', name: 'Turníx', sci: 'Turnix sylvaticus', habitat: 'Dry scrublands', rarity: 'frecuente' },
    { id: 'urraca-común', name: 'Urraca Común', sci: 'Pica pica', habitat: 'Urban areas', rarity: 'abundante' },
    { id: 'vencejo-común', name: 'Vencejo Común', sci: 'Apus apus', habitat: 'Urban areas', rarity: 'abundante' },
    { id: 'verdecillo', name: 'Verdecillo', sci: 'Serinus serinus', habitat: 'Gardens', rarity: 'abundante' },
    { id: 'verderon-común', name: 'Verderón Común', sci: 'Chloris chloris', habitat: 'Gardens', rarity: 'abundante' },
    { id: 'zarapito-real', name: 'Zarapito Real', sci: 'Numenius arquata', habitat: 'Estuaries', rarity: 'rara' },
    { id: 'zorzal-charlo', name: 'Zorzal Charlo', sci: 'Turdus viscivorus', habitat: 'Open woodland', rarity: 'abundante' },
    { id: 'zurito-paloma', name: 'Zurito Paloma', sci: 'Columba oenas', habitat: 'Woodlands', rarity: 'frecuente' },
    { id: 'agachadiza-común', name: 'Agachadiza Común', sci: 'Gallinago gallinago', habitat: 'Marshes', rarity: 'frecuente' },
    { id: 'agateador-europeo', name: 'Agateador Europeo', sci: 'Certhia brachydactyla', habitat: 'Forests', rarity: 'abundante' },
    { id: 'alcatraz-atlántico', name: 'Alcatraz Atlántico', sci: 'Morus bassanus', habitat: 'Sea cliffs', rarity: 'frecuente' },
    { id: 'aligación-común', name: 'Alimoche Común', sci: 'Neophron percnopterus', habitat: 'Open mountain', rarity: 'rara' },
    { id: 'ardea-purpúrea', name: 'Garza Imperial', sci: 'Ardea purpurea', habitat: 'Reed beds', rarity: 'frecuente' },
    { id: 'archibebe-claro', name: 'Archibebe Claro', sci: 'Tringa nebularia', habitat: 'Wetlands', rarity: 'frecuente' },
    { id: 'avefría-europea', name: 'Avefría Europea', sci: 'Vanellus vanellus', habitat: 'Farmland', rarity: 'frecuente' },
    { id: 'avión-roquero', name: 'Avión Roquero', sci: 'Ptyonoprogne rupestris', habitat: 'Rocky cliffs', rarity: 'frecuente' },
    { id: 'avispa-negra', name: 'Águila Culebrera', sci: 'Circaetus gallicus', habitat: 'Open woodlands', rarity: 'rara' },
    { id: 'bisbita-pratense', name: 'Bisbita Pratense', sci: 'Anthus pratensis', habitat: 'Grasslands', rarity: 'abundante' },
    { id: 'busardo-ratonero', name: 'Busardo Ratonero', sci: 'Buteo buteo', habitat: 'Farmland', rarity: 'frecuente' },
    { id: 'chova-piquirroja', name: 'Chova Piquirroja', sci: 'Pyrrhocorax pyrrhocorax', habitat: 'Sea cliffs', rarity: 'rara' },
    { id: 'chotacabras', name: 'Chotacabras', sci: 'Caprimulgus ruficollis', habitat: 'Dry scrublands', rarity: 'frecuente' },
    { id: 'cigüeñuela-caminante', name: 'Cigüeñuela', sci: 'Himantopus himantopus', habitat: 'Shallow wetlands', rarity: 'frecuente' },
    { id: 'curruca-capirotada', name: 'Curruca Capirotada', sci: 'Sylvia melanocephala', habitat: 'Scrublands', rarity: 'abundante' },
    { id: 'espátula-europea', name: 'Espátula Europea', sci: 'Platalea leucorodia', habitat: 'Shallow wetlands', rarity: 'rara' },
    { id: 'flamenco-de-chile', name: 'Flamenco de Chile', sci: 'Phoenicopterus chilensis', habitat: 'Salt lakes', rarity: 'rara' },
    { id: 'fulmar-boreal', name: 'Fulmar Boreal', sci: 'Fulmarus glacialis', habitat: 'Sea cliffs', rarity: 'frecuente' },
    { id: 'gaviota-argéntea', name: 'Gaviota Argéntea', sci: 'Larus argentatus', habitat: 'Coasts', rarity: 'abundante' },
    { id: 'gaviota-de-audouin', name: 'Gaviota de Audouin', sci: 'Larus audouinii', habitat: 'Mediterranean coasts', rarity: 'rara' },
    { id: 'gaviota-patiamarilla', name: 'Gaviota Patiamarilla', sci: 'Larus michahellis', habitat: 'Coasts', rarity: 'abundante' },
    { id: 'golondrina-ribereña', name: 'Golondrina Ribereña', sci: 'Riparia riparia', habitat: 'River banks', rarity: 'frecuente' },
    { id: 'gorrión-alpino', name: 'Gorrión Alpino', sci: 'Montifringilla nivalis', habitat: 'Alpine zones', rarity: 'rara' },
    { id: 'gorrión-chillón', name: 'Gorrión Chillón', sci: 'Petronia petronia', habitat: 'Rocky areas', rarity: 'frecuente' },
    { id: 'gorrión-moruno', name: 'Gorrión Moruno', sci: 'Passer hispaniolensis', habitat: 'Farmland', rarity: 'abundante' },
    { id: 'halcón-peregrino', name: 'Halcón Peregrino', sci: 'Falco peregrinus', habitat: 'Cliffs and urban', rarity: 'rara' },
    { id: 'herrerillo-capuchino', name: 'Herrerillo Capuchino', sci: 'Lophophanes cristatus', habitat: 'Conifer forests', rarity: 'frecuente' },
    { id: 'herrerillo-común', name: 'Herrerillo Común', sci: 'Cyanistes caeruleus', habitat: 'Woodlands', rarity: 'abundante' },
    { id: 'lanius-meridional', name: 'Alcaudón Meridional', sci: 'Lanius meridionalis', habitat: 'Dry scrublands', rarity: 'frecuente' },
    { id: 'lúgano', name: 'Lúgano', sci: 'Spinus spinus', habitat: 'Woodlands', rarity: 'abundante' },
    { id: 'macagua-reidor', name: 'Macagua Reidor', sci: 'Herpetotheres cachinnans', habitat: 'Forests', rarity: 'rara' },
    { id: 'macho-cormorán-moñudo', name: 'Cormorán Moñudo', sci: 'Phalacrocorax aristotelis', habitat: 'Sea cliffs', rarity: 'frecuente' },
    { id: 'martín-común', name: 'Martín Común', sci: 'Alcedo atthis', habitat: 'Rivers', rarity: 'frecuente' },
    { id: 'martinet-de-noche', name: 'Martinete Común', sci: 'Nycticorax nycticorax', habitat: 'Wetlands', rarity: 'frecuente' },
    { id: 'mazarico-galego', name: 'Mazarico', sci: 'Numenius phaeopus', habitat: 'Coastal wetlands', rarity: 'frecuente' },
    { id: 'mergansers', name: 'Serreta Grande', sci: 'Mergus merganser', habitat: 'Rivers', rarity: 'rara' },
    { id: 'milano-real', name: 'Milano Real', sci: 'Milvus milvus', habitat: 'Rolling hills', rarity: 'rara' },
    { id: 'mirlo-capiblanco', name: 'Mirlo Capiblanco', sci: 'Turdus torquatus', habitat: 'Mountain forests', rarity: 'frecuente' },
    { id: 'ostrero-euroasiático', name: 'Ostrero Euroasiático', sci: 'Haematopus ostralegus', habitat: 'Coasts', rarity: 'frecuente' },
    { id: 'pagaza-piquirroja', name: 'Pagaza Piquirroja', sci: 'Sterna caspia', habitat: 'Coasts', rarity: 'rara' },
    { id: 'paloma-zurita', name: 'Paloma Zurita', sci: 'Columba oenas', habitat: 'Forests', rarity: 'frecuente' },
    { id: 'pato-aguja', name: 'Pato Aguja', sci: 'Anhinga anhinga', habitat: 'Lakes', rarity: 'frecuente' },
    { id: 'pato-cabeciverde', name: 'Pato Cabeciverde', sci: 'Anas crecca', habitat: 'Wetlands', rarity: 'frecuente' },
    { id: 'pato-morisco', name: 'Pato Morisco', sci: 'Oxyura leucocephala', habitat: 'Lakes', rarity: 'excepcional' },
    { id: 'pato-pinto', name: 'Pato Pinto', sci: 'Mareca penelope', habitat: 'Coastal wetlands', rarity: 'frecuente' },
    { id: 'perdiz-roja', name: 'Perdiz Roja', sci: 'Alectoris rufa', habitat: 'Farmland', rarity: 'frecuente' },
    { id: 'pico-mediano', name: 'Pico Mediano', sci: 'Leiopicus medius', habitat: 'Oak forests', rarity: 'rara' },
    { id: 'pico-picapinos', name: 'Pico Picapinos', sci: 'Dendrocopos major', habitat: 'Woodlands', rarity: 'frecuente' },
    { id: 'picogordo-2', name: 'Picogordo de los Pinos', sci: 'Pinicola enucleator', habitat: 'Boreal forests', rarity: 'rara' },
    { id: 'piquero-nazca', name: 'Piquero de Nazca', sci: 'Sula granti', habitat: 'Island coasts', rarity: 'rara' },
    { id: 'pitachat', name: 'Tarabilla Común', sci: 'Saxicola rubicola', habitat: 'Scrublands', rarity: 'abundante' },
    { id: 'pluvial-dorado', name: 'Pluvial Dorado', sci: 'Pluvialis apricaria', habitat: 'Moorland', rarity: 'frecuente' },
    { id: 'polluela-pintoja', name: 'Polluela Pintoja', sci: 'Porzana porzana', habitat: 'Reed beds', rarity: 'rara' },
    { id: 'rana-pájaro', name: 'Alcaraván Común', sci: 'Burhinus oedicnemus', habitat: 'Open dry areas', rarity: 'frecuente' },
    { id: 'rascón-europeo', name: 'Rascón Europeo', sci: 'Rallus aquaticus', habitat: 'Reed beds', rarity: 'frecuente' },
    { id: 'roquero-rojo', name: 'Roquero Rojo', sci: 'Monticola saxatilis', habitat: 'Rocky slopes', rarity: 'frecuente' },
    { id: 'ruiseñor-bastardo', name: 'Ruiseñor Bastardo', sci: 'Cettia cetti', habitat: 'River thickets', rarity: 'frecuente' },
    { id: 'ruiseñor-común', name: 'Ruiseñor Común', sci: 'Luscinia megarhynchos', habitat: 'Dense undergrowth', rarity: 'frecuente' },
    { id: 'somormujo-lavanco', name: 'Somormujo Lavanco', sci: 'Podiceps cristatus', habitat: 'Lakes', rarity: 'frecuente' },
    { id: 'torcecuellos', name: 'Torcecuellos', sci: 'Jynx torquilla', habitat: 'Open woodlands', rarity: 'frecuente' },
    { id: 'totovía', name: 'Totovía', sci: 'Lullula arborea', habitat: 'Heathlands', rarity: 'frecuente' },
    { id: 'trepador-azul', name: 'Trepador Azul', sci: 'Sitta europaea', habitat: 'Woodlands', rarity: 'frecuente' },
    { id: 'triguero-2', name: 'Escribano Triguero', sci: 'Emberiza calandra', habitat: 'Farmland', rarity: 'abundante' },
    { id: 'verdecillo-2', name: 'Verdecillo Andino', sci: 'Sporophila luctuosa', habitat: 'Andean forests', rarity: 'frecuente' },
    { id: 'vimbrel-americano', name: 'Chorlo Gritón', sci: 'Charadrius semipalmatus', habitat: 'Beaches', rarity: 'frecuente' },
    { id: 'vireo-rojo', name: 'Vireo de Ojos Rojos', sci: 'Vireo olivaceus', habitat: 'Deciduous forests', rarity: 'frecuente' },
    { id: 'zancudo-americano', name: 'Zancudo Americano', sci: 'Mycteria americana', habitat: 'Wetlands', rarity: 'frecuente' },
    { id: 'zorzal-alirrojo', name: 'Zorzal Alirrojo', sci: 'Turdus iliacus', habitat: 'Woodlands', rarity: 'abundante' },
    { id: 'zorzal-real', name: 'Zorzal Real', sci: 'Turdus pilaris', habitat: 'Open woodlands', rarity: 'abundante' },
];

// Rarity mapping from KYNDO naming to DB values
const RARITY_MAP: Record<string, string> = {
    abundante: 'abundante',
    frecuente: 'frecuente',
    rara: 'rara',
    excepcional: 'excepcional',
};

async function seedExtra200() {
    console.log('🌱 Seeding 200-card batch...\n');

    const existing = await prisma.card.findMany({ select: { cardId: true } });
    const existingIds = new Set(existing.map((c) => c.cardId));
    console.log(`📊 Currently in DB: ${existingIds.size} cards\n`);

    let created = 0;
    let skipped = 0;

    for (const bird of EXTRA_BIRDS) {
        if (existingIds.has(bird.id)) {
            skipped++;
            continue;
        }

        try {
            await prisma.card.create({
                data: {
                    cardId: bird.id,
                    title: bird.name,
                    description: `${bird.sci} — ${bird.habitat}`,
                    rarity: RARITY_MAP[bird.rarity] ?? 'abundante',
                    packId: 'birds-extended',
                    metadata: {
                        scientificName: bird.sci,
                        habitat: bird.habitat,
                        source: 'seed-200',
                    },
                },
            });
            console.log(`   ✓ ${bird.name} (${bird.rarity})`);
            created++;
        } catch (err) {
            console.error(`   ✗ ${bird.id}:`, err);
        }
    }

    const total = await prisma.card.count();
    console.log(`\n✅ Done! ${created} new cards added, ${skipped} skipped.`);
    console.log(`📦 Total cards in database: ${total}`);
}

seedExtra200()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
