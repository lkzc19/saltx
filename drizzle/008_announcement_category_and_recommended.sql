-- 添加分类字段
ALTER TABLE announcement ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
-- 将 is_pinned 重命名为 is_recommended 并改值（'true'→'true', 语义不变）
-- SQLite 不支持直接 rename column，用新建+迁移+删除的方式
ALTER TABLE announcement RENAME TO announcement_old;
CREATE TABLE announcement (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  cover_file_key TEXT,
  is_recommended TEXT NOT NULL DEFAULT 'false',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
);
INSERT INTO announcement (id, title, content, cover_file_key, is_recommended, created_at, updated_at, category)
SELECT id, title, content, cover_file_key, is_pinned, created_at, updated_at, 'general' FROM announcement_old;
DROP TABLE announcement_old;
