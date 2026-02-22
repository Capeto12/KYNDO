import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { Prisma } from '@prisma/client';
import prisma from '../prismaClient';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import { ValidationError, ensureString } from '../lib/validation';

const router = Router();

interface BirdInput {
  cardId?: string;
  id?: string;
  card_id?: string;
  title?: string;
  name?: string;
  commonName?: string;
  common_name?: string;
  description?: string;
  rarity?: string;
  imageUrl?: string;
  image_url?: string;
  packId?: string;
  metadata?: Record<string, unknown>;
  scientificName?: string;
  scientific_name?: string;
  habitat?: string;
}

function buildMetadata(existingMetadata: unknown, bird: BirdInput): Prisma.InputJsonValue {
  const fallbackMetadata = {
    scientificName: bird.scientificName || bird.scientific_name,
    habitat: bird.habitat,
  } as Record<string, unknown>;

  const incoming = (bird.metadata || fallbackMetadata) as Record<string, unknown>;
  const base = (existingMetadata as Record<string, unknown>) || {};
  return { ...base, ...incoming } as Prisma.InputJsonValue;
}

function isPathInside(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function parseJsonOrArray(rawContent: string): BirdInput[] {
  const parsed = JSON.parse(rawContent) as BirdInput[] | { cards?: BirdInput[] } | BirdInput;
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray((parsed as { cards?: BirdInput[] }).cards)) {
    return (parsed as { cards: BirdInput[] }).cards;
  }
  return [parsed as BirdInput];
}

const upload = multer({
  dest: path.join(process.cwd(), 'uploads', 'birds'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.post('/upload', requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio ningun archivo' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const rawContent = await fs.readFile(req.file.path, 'utf-8');

    let birds: BirdInput[] = [];

    if (ext === '.json') {
      birds = parseJsonOrArray(rawContent);
    } else if (ext === '.csv') {
      birds = parse(rawContent, { columns: true, skip_empty_lines: true }) as BirdInput[];
    } else {
      return res.status(400).json({ error: 'Formato no soportado. Use .json o .csv' });
    }

    const results = await upsertBirds(birds);

    return res.json({
      message: 'Importacion completada',
      created: results.created,
      updated: results.updated,
      failed: results.failed,
      total: birds.length,
    });
  } catch (error) {
    console.error('Import upload error:', error);
    return res.status(500).json({ error: 'Error al procesar el archivo' });
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => undefined);
    }
  }
});

router.post('/local-folder', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (config.isProduction && !config.allowLocalImport) {
      return res.status(403).json({ error: 'Import local deshabilitado en produccion' });
    }

    const folderPath = ensureString(req.body.folderPath, 'folderPath', { maxLength: 500 });
    const packId = typeof req.body.packId === 'string' ? req.body.packId : undefined;

    const resolvedTarget = path.resolve(folderPath);
    if (!isPathInside(config.importLocalRoot, resolvedTarget)) {
      return res.status(403).json({ error: 'folderPath fuera del directorio permitido para import' });
    }

    let entries: string[] = [];
    try {
      entries = await fs.readdir(resolvedTarget);
    } catch {
      return res.status(400).json({ error: 'No se puede acceder a la carpeta indicada' });
    }

    const jsonFiles = entries.filter((fileName) => fileName.endsWith('.json'));
    const results = { created: 0, updated: 0, failed: 0 };

    for (const jsonFile of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(resolvedTarget, jsonFile), 'utf-8');
        const data = parseJsonOrArray(content);
        const fileResults = await upsertBirds(data, packId);
        results.created += fileResults.created;
        results.updated += fileResults.updated;
        results.failed += fileResults.failed;
      } catch {
        results.failed += 1;
      }
    }

    return res.json({ message: 'Importacion desde carpeta local completada', ...results, filesProcessed: jsonFiles.length });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al importar desde carpeta local' });
  }
});

router.post('/google-drive', requireAdmin, async (req: AuthRequest, res: Response) => {
  const hasCredentials =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!hasCredentials) {
    return res.status(501).json({
      error: 'Google Drive no esta configurado',
      setup: 'Anade GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_KEY al archivo .env',
      docs: 'https://cloud.google.com/iam/docs/service-accounts',
    });
  }

  try {
    const folderId = ensureString(req.body.folderId, 'folderId', { maxLength: 200 });
    const packId = typeof req.body.packId === 'string' ? req.body.packId : undefined;

    const { google } = await import('googleapis');
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

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
          const stream = dl.data as NodeJS.ReadableStream;
          stream.on('data', (chunk) => chunks.push(chunk as Buffer));
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        const content = Buffer.concat(chunks).toString('utf-8');
        const data = parseJsonOrArray(content);
        const fileResults = await upsertBirds(data, packId);
        results.created += fileResults.created;
        results.updated += fileResults.updated;
        results.failed += fileResults.failed;
      } catch {
        results.failed += 1;
      }
    }

    return res.json({
      message: 'Importacion desde Google Drive completada',
      filesProcessed: files.length,
      ...results,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Google Drive import error:', error);
    return res.status(500).json({ error: 'Error al importar desde Google Drive' });
  }
});

async function upsertBirds(birds: BirdInput[], defaultPackId?: string) {
  const results = { created: 0, updated: 0, failed: 0 };

  for (const bird of birds) {
    const cardId = bird.cardId || bird.id || bird.card_id;
    const title = bird.title || bird.name || bird.commonName || bird.common_name;

    if (!cardId || !title) {
      results.failed += 1;
      continue;
    }

    try {
      const existing = await prisma.card.findUnique({ where: { cardId } });
      const resolvedRarity =
        typeof bird.rarity === 'string' && bird.rarity.trim().length > 0
          ? bird.rarity.trim()
          : existing?.rarity || 'abundante';

      if (existing) {
        await prisma.card.update({
          where: { cardId },
          data: {
            title,
            description: bird.description,
            rarity: resolvedRarity,
            imageUrl: bird.imageUrl || bird.image_url || existing.imageUrl,
            packId: bird.packId || defaultPackId || existing.packId,
            metadata: buildMetadata(existing.metadata, bird),
          },
        });
        results.updated += 1;
      } else {
        await prisma.card.create({
          data: {
            cardId,
            title,
            description: bird.description,
            rarity: resolvedRarity,
            imageUrl: bird.imageUrl || bird.image_url,
            packId: bird.packId || defaultPackId || 'imported',
            metadata: buildMetadata(undefined, bird),
          },
        });
        results.created += 1;
      }
    } catch {
      results.failed += 1;
    }
  }

  return results;
}

export default router;
