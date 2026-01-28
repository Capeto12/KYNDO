import { Router } from 'express';
import { validateAdminKey, patchCard } from '../controllers/cardsController';

const router = Router();

// Admin routes require admin key validation
router.patch('/cards/:id', validateAdminKey, patchCard);

export default router;
