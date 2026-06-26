CREATE TABLE IF NOT EXISTS announcement (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cover_file_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
