import { Router } from "express";
import { patchCard } from "../controllers/cardsController";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

// Admin PATCH to update card (e.g., rarity). Simple admin key check.
router.patch("/:id", upload.none(), patchCard);

export default router;
