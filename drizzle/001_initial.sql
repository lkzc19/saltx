CREATE TABLE music (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	artist TEXT NOT NULL,
	extension TEXT NOT NULL,
	file_key TEXT NOT NULL,
	cover_file_key TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE image (
	id TEXT PRIMARY KEY NOT NULL,
	file_key TEXT NOT NULL,
	name TEXT NOT NULL,
	extension TEXT NOT NULL,
	aspect_ratio TEXT NOT NULL,
	background_color TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);
