import { Router } from 'express';
import { patchCard, upsertCard, patchCardTags } from '../controllers/cardsController';
import { requireAdminOrKey } from '../middleware/auth';

const router = Router();

router.patch('/cards/:id', requireAdminOrKey, patchCard);
router.post('/cards', requireAdminOrKey, upsertCard);
router.patch('/cards/:cardId/tags', requireAdminOrKey, patchCardTags);

export default router;
