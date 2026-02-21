import { Router } from 'express';
import { validateAdminKey, patchCard, upsertCard, patchCardTags } from '../controllers/cardsController';

const router = Router();

// Admin routes require admin key validation
router.patch('/cards/:id', validateAdminKey, patchCard);

// Upsert a card by cardId (no auth — local admin panel only)
router.post('/cards', upsertCard);

// Update tags by cardId (no auth — local admin panel only)
router.patch('/cards/:cardId/tags', patchCardTags);

export default router;
