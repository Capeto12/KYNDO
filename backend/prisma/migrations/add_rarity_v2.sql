-- Add rarity_v2 column for gradual migration
-- This migration is idempotent and can be run multiple times safely

ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS rarity_v2 VARCHAR(64);

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_cards_rarity_v2 ON cards(rarity_v2);

-- Optional: Set default value for existing records
-- UPDATE cards SET rarity_v2 = rarity WHERE rarity_v2 IS NULL;
