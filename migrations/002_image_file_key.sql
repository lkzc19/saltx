ALTER TABLE image ADD COLUMN file_key TEXT;
UPDATE image SET file_key = 'image/' || id || '.' || extension;
