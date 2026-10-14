-- Existing visits were recorded only from the homepage. Preserve those rows
-- and backfill the known path instead of dropping/recreating the table.
ALTER TABLE "visitors" ADD COLUMN "path" TEXT NOT NULL DEFAULT '/';
