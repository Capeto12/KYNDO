-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "atk" INTEGER,
ADD COLUMN     "audio_url" TEXT,
ADD COLUMN     "common_name" TEXT,
ADD COLUMN     "def" INTEGER,
ADD COLUMN     "family" TEXT,
ADD COLUMN     "family_group" TEXT,
ADD COLUMN     "flight_range" TEXT,
ADD COLUMN     "habitat" TEXT,
ADD COLUMN     "height_cm" TEXT,
ADD COLUMN     "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "order" TEXT,
ADD COLUMN     "scientific_name" TEXT,
ADD COLUMN     "species" TEXT;
