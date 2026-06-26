ALTER TABLE image DROP COLUMN background_color;
UPDATE image SET background_colors = NULL;
