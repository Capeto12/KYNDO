import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import prisma from '../prismaClient';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Multer: save to local uploads dir
const upload = multer({
    dest: path.join(process.cwd(), 'uploads', 'birds'),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.csv', '.json', '.webp', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    },
});

// ── POST /api/admin/import/upload ───────────────────────────────────────
// Upload a JSON or CSV file with bird card data
router.post('/upload', requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

        const ext = path.extname(req.file.originalname).toLowerCase();
        const rawContent = await fs.readFile(req.file.path, 'utf-8');

        let birds: any[] = [];

        if (ext === '.json') {
            const parsed = JSON.parse(rawContent);
            birds = Array.isArray(parsed) ? parsed : parsed.cards || [parsed];
        } else if (ext === '.csv') {
            birds = parse(rawContent, { columns: true, skip_empty_lines: true });
        } else {
            return res.status(400).json({ error: 'Formato no soportado. Use .json o .csv' });
        }

        const results = await upsertBirds(birds);
        // Clean up temp file
        await fs.unlink(req.file.path).catch(() => { });

        return res.json({
            message: `Importación completada`,
            created: results.created,
            updated: results.updated,
            failed: results.failed,
            total: birds.length,
        });
    } catch (err: any) {
        console.error('Import upload error:', err);
        return res.status(500).json({ error: 'Error al procesar el archivo', detail: err.message });
    }
});

// ── POST /api/admin/import/local-folder ─────────────────────────────────
// Import from a local server-side folder path (dev / internal)
router.post('/local-folder', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { folderPath, packId } = req.body;
        if (!folderPath) return res.status(400).json({ error: 'folderPath es requerido' });

        let entries: string[] = [];
        try {
            entries = await fs.readdir(folderPath);
        } catch {
            return res.status(400).json({ error: 'No se puede acceder a la carpeta indicada' });
        }

        const jsonFiles = entries.filter((f) => f.endsWith('.json'));
        const results = { created: 0, updated: 0, failed: 0 };

        for (const jsonFile of jsonFiles) {
            try {
                const content = await fs.readFile(path.join(folderPath, jsonFile), 'utf-8');
                const data = JSON.parse(content);
                const fileResults = await upsertBirds(Array.isArray(data) ? data : [data], packId);
                results.created += fileResults.created;
                results.updated += fileResults.updated;
                results.failed += fileResults.failed;
            } catch (err) {
                results.failed++;
            }
        }

        return res.json({ message: 'Importación desde carpeta local completada', ...results, filesProcessed: jsonFiles.length });
    } catch (err: any) {
        return res.status(500).json({ error: 'Error al importar desde carpeta local', detail: err.message });
    }
});

// ── POST /api/admin/import/google-drive ─────────────────────────────────
// Placeholder — Google Drive integration (requires service account credentials)
router.post('/google-drive', requireAdmin, async (req: AuthRequest, res: Response) => {
    // Check if Google credentials are configured
    const hasCredentials =
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!hasCredentials) {
        return res.status(501).json({
            error: 'Google Drive no está configurado',
            setup: 'Añade GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_KEY al archivo .env',
            docs: 'https://cloud.google.com/iam/docs/service-accounts',
        });
    }

    try {
        const { folderId, packId } = req.body;
        if (!folderId) return res.status(400).json({ error: 'folderId es requerido (ID de carpeta de Google Drive)' });

        // Lazy-load googleapis to avoid startup cost when not used
        const { google } = await import('googleapis');
        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // List JSON files in the folder
        const list = await drive.files.list({
            q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
            fields: 'files(id, name)',
        });

        const files = list.data.files || [];
        const results = { created: 0, updated: 0, failed: 0 };

        for (const file of files) {
            try {
                const dl = await drive.files.get({ fileId: file.id!, alt: 'media' }, { responseType: 'stream' });
                const chunks: Buffer[] = [];
                await new Promise<void>((resolve, reject) => {
                    (dl.data as any).on('data', (c: Buffer) => chunks.push(c));
                    (dl.data as any).on('end', resolve);
                    (dl.data as any).on('error', reject);
                });
                const content = Buffer.concat(chunks).toString('utf-8');
                const data = JSON.parse(content);
                const fileResults = await upsertBirds(Array.isArray(data) ? data : [data], packId);
                results.created += fileResults.created;
                results.updated += fileResults.updated;
                results.failed += fileResults.failed;
            } catch {
                results.failed++;
            }
        }

        return res.json({
            message: 'Importación desde Google Drive completada',
            filesProcessed: files.length,
            ...results,
        });
    } catch (err: any) {
        console.error('Google Drive import error:', err);
        return res.status(500).json({ error: 'Error al importar desde Google Drive', detail: err.message });
    }
});

// ── Helper: upsert bird records ─────────────────────────────────────────
async function upsertBirds(birds: any[], defaultPackId?: string) {
    const results = { created: 0, updated: 0, failed: 0 };

    for (const bird of birds) {
        const cardId = bird.cardId || bird.id || bird.card_id;
        const title = bird.title || bird.name || bird.commonName || bird.common_name;

        if (!cardId || !title) {
            results.failed++;
            continue;
        }

        try {
            const existing = await prisma.card.findUnique({ where: { cardId } });
            if (existing) {
                await prisma.card.update({
                    where: { cardId },
                    data: {
                        title,
                        description: bird.description,
                        rarity: bird.rarity || existing.rarity,
                        imageUrl: bird.imageUrl || bird.image_url || existing.imageUrl,
                        packId: bird.packId || defaultPackId || existing.packId,
                        metadata: {
                            ...(existing.metadata as object || {}),
                            ...(bird.metadata || {
                                scientificName: bird.scientificName || bird.scientific_name,
                                habitat: bird.habitat,
                            }),
                        },
                    },
                });
                results.updated++;
            } else {
                await prisma.card.create({
                    data: {
                        cardId,
                        title,
                        description: bird.description,
                        rarity: bird.rarity || 'abundante',
                        imageUrl: bird.imageUrl || bird.image_url,
                        packId: bird.packId || defaultPackId || 'imported',
                        metadata: bird.metadata || {
                            scientificName: bird.scientificName || bird.scientific_name,
                            habitat: bird.habitat,
                        },
                    },
                });
                results.created++;
            }
        } catch {
            results.failed++;
        }
    }

    return results;
}

export default router;
