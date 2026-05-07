ALTER TABLE music RENAME COLUMN cover_image_id TO cover_file_key;
UPDATE music SET cover_file_key = NULL;
