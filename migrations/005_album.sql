CREATE TABLE album (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  artist TEXT,
  description TEXT,
  cover_file_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE album_music (
  album_id TEXT NOT NULL REFERENCES album(id) ON DELETE CASCADE,
  music_id TEXT NOT NULL REFERENCES music(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (album_id, music_id)
);
