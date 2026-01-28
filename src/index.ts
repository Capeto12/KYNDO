import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import adminCardsRouter from "./routes/adminCards";
import prisma from "./prismaClient";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Public endpoint to get card presentation
app.get("/api/cards/:id/presentation", async (req, res) => {
  const id = req.params.id;
  try {
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) return res.status(404).json({ error: "Card not found" });

    // Merge global presentation rule by rarity
    const rule = await prisma.presentationRule.findFirst({
      where: { rarity: card.rarity },
      orderBy: { updatedAt: "desc" },
    });

    return res.json({
      card: {
        id: card.id,
        title: card.title,
        rarity: card.rarity,
        assetPath: card.assetPath,
        thumbnailPath: card.thumbnailPath,
      },
      presentation: rule ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.use("/api/admin/cards", adminCardsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
