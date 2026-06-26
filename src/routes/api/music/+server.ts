import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image, music } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const rows = await db
		.select({
			id: music.id,
			name: music.name,
			artist: music.artist,
			file_key: music.file_key,
			cover_file_key: music.cover_file_key,
			background_colors: image.background_colors,
			created_at: music.created_at,
			updated_at: music.updated_at
		})
		.from(music)
		.leftJoin(image, eq(music.cover_file_key, image.file_key))
		.orderBy(asc(music.created_at), asc(music.id));

	const items = rows.map((row) => {
		let background_color: string | null = null;
		if (row.background_colors) {
			try {
				const bg = JSON.parse(row.background_colors);
				background_color = bg.active ?? null;
			} catch {
				// ignore
			}
		}
		return {
			id: row.id,
			name: row.name,
			artist: row.artist,
			file_key: row.file_key,
			cover_file_key: row.cover_file_key,
			background_color,
			created_at: row.created_at,
			updated_at: row.updated_at
		};
	});

	return json({ items });
};
