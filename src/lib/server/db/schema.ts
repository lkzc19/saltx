import { customAlphabet } from 'nanoid';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const nanoid8 = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const music = sqliteTable('music', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid8()),
	name: text('name').notNull(),
	artist: text('artist').notNull(),
	version: text('version').notNull(),
	extension: text('extension').notNull(),
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
	name: text('name').notNull(),
	extension: text('extension').notNull(),
	aspect_ratio: text('aspect_ratio').notNull(),
	thumbnail_key: text('thumbnail_key'),
	created_at: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updated_at: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});
