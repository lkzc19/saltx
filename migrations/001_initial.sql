CREATE TABLE 'music' (
	'id' text PRIMARY KEY NOT NULL,
	'name' text NOT NULL,
	'artist' text NOT NULL,
	'version' text NOT NULL,
	'extension' text NOT NULL,
	'created_at' text NOT NULL,
	'updated_at' text NOT NULL
);
CREATE TABLE 'image' (
	'id' text PRIMARY KEY NOT NULL,
	'name' text NOT NULL,
	'extension' text NOT NULL,
	'aspect_ratio' text NOT NULL,
	'thumbnail_key' text,
	'created_at' text NOT NULL,
	'updated_at' text NOT NULL
);