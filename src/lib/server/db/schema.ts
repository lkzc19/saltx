import { customAlphabet } from 'nanoid';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const nanoid8 = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

export const music = sqliteTable('music', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid8()),
	name: text('name').notNull(),
	artist: text('artist').notNull(),
	extension: text('extension').notNull(),
	file_key: text('file_key').notNull(),
	cover_file_key: text('cover_file_key'),
	created_at: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updated_at: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const image = sqliteTable('image', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid8()),
	file_key: text('file_key').notNull(),
	name: text('name').notNull(),
	extension: text('extension').notNull(),
	aspect_ratio: text('aspect_ratio').notNull(),
	background_color: text('background_color'),
	created_at: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updated_at: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});
