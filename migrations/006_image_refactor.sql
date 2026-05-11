-- image 表重构：file_key 存储 R2 完整路径
-- 格式：image/{id}.{extension}
-- 其他表（album.music）存储 image.file_key 引用

-- 1. 更新 image.file_key 为 R2 完整路径
UPDATE image SET file_key = 'image/' || id || '.' || extension;

-- 2. 更新 album.cover_file_key 引用 image.file_key（如果之前存的是 id）
UPDATE album
SET cover_file_key = (
  SELECT image.file_key FROM image
  WHERE image.file_key LIKE '%' || album.cover_file_key || '%'
  LIMIT 1
)
WHERE album.cover_file_key IS NOT NULL;

-- 3. 更新 music.cover_file_key 引用 image.file_key（如果之前存的是 id）
UPDATE music
SET cover_file_key = (
  SELECT image.file_key FROM image
  WHERE image.file_key LIKE '%' || music.cover_file_key || '%'
  LIMIT 1
)
WHERE music.cover_file_key IS NOT NULL;