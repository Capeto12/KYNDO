-- CreateEnum
CREATE TYPE "CatalogCardType" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "CatalogRarity" AS ENUM ('common', 'rare', 'epic', 'legendary');

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "domains" (
    "domain_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("domain_id")
);

-- CreateTable
CREATE TABLE "objects" (
    "object_id" UUID NOT NULL,
    "domain_id" UUID NOT NULL,
    "scientific_name" VARCHAR(255),
    "common_name" VARCHAR(255),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objects_pkey" PRIMARY KEY ("object_id")
);

-- CreateTable
CREATE TABLE "object_images" (
    "image_id" UUID NOT NULL,
    "object_id" UUID NOT NULL,
    "variant_index" INTEGER NOT NULL,
    "image_path" VARCHAR(500) NOT NULL,
    "format" VARCHAR(10) NOT NULL DEFAULT 'webp',
    "source" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "object_images_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "catalog_cards" (
    "card_id" UUID NOT NULL,
    "object_id" UUID NOT NULL,
    "type" "CatalogCardType" NOT NULL,
    "rarity" "CatalogRarity" NOT NULL DEFAULT 'common',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_cards_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "attack_factors" (
    "object_id" UUID NOT NULL,
    "p" DECIMAL(3,1) NOT NULL,
    "s" DECIMAL(3,1) NOT NULL,
    "w" DECIMAL(3,1) NOT NULL,
    "h" DECIMAL(3,1) NOT NULL,
    "a" DECIMAL(3,1) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attack_factors_pkey" PRIMARY KEY ("object_id")
);

-- CreateTable
CREATE TABLE "defense_factors" (
    "object_id" UUID NOT NULL,
    "ad" DECIMAL(3,1) NOT NULL,
    "c" DECIMAL(3,1) NOT NULL,
    "e" DECIMAL(3,1) NOT NULL,
    "sd" DECIMAL(3,1) NOT NULL,
    "r" DECIMAL(3,1) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defense_factors_pkey" PRIMARY KEY ("object_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "username" TEXT,
    "role" TEXT NOT NULL DEFAULT 'player',
    "pairs_grade" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'earned',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "card_count" INTEGER NOT NULL DEFAULT 5,
    "rarity_pool" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "cards_won" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pack_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domains_name_key" ON "domains"("name");

-- CreateIndex
CREATE INDEX "domains_status_idx" ON "domains"("status");

-- CreateIndex
CREATE INDEX "objects_domain_id_idx" ON "objects"("domain_id");

-- CreateIndex
CREATE INDEX "objects_scientific_name_idx" ON "objects"("scientific_name");

-- CreateIndex
CREATE INDEX "objects_common_name_idx" ON "objects"("common_name");

-- CreateIndex
CREATE INDEX "object_images_object_id_idx" ON "object_images"("object_id");

-- CreateIndex
CREATE UNIQUE INDEX "object_images_object_id_variant_index_key" ON "object_images"("object_id", "variant_index");

-- CreateIndex
CREATE INDEX "catalog_cards_object_id_idx" ON "catalog_cards"("object_id");

-- CreateIndex
CREATE INDEX "catalog_cards_type_idx" ON "catalog_cards"("type");

-- CreateIndex
CREATE INDEX "catalog_cards_rarity_idx" ON "catalog_cards"("rarity");

-- CreateIndex
CREATE UNIQUE INDEX "uq_object_type" ON "catalog_cards"("object_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "user_cards_user_id_idx" ON "user_cards"("user_id");

-- CreateIndex
CREATE INDEX "user_cards_card_id_idx" ON "user_cards"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_cards_user_id_card_id_key" ON "user_cards"("user_id", "card_id");

-- CreateIndex
CREATE INDEX "packs_is_active_idx" ON "packs"("is_active");

-- CreateIndex
CREATE INDEX "pack_purchases_user_id_idx" ON "pack_purchases"("user_id");

-- CreateIndex
CREATE INDEX "pack_purchases_pack_id_idx" ON "pack_purchases"("pack_id");

-- AddForeignKey
ALTER TABLE "objects" ADD CONSTRAINT "objects_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("domain_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_images" ADD CONSTRAINT "object_images_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects"("object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_cards" ADD CONSTRAINT "catalog_cards_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects"("object_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attack_factors" ADD CONSTRAINT "attack_factors_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects"("object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defense_factors" ADD CONSTRAINT "defense_factors_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects"("object_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_purchases" ADD CONSTRAINT "pack_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_purchases" ADD CONSTRAINT "pack_purchases_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
