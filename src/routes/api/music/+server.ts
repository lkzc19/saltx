import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image, music } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const items = await db
		.select({
			id: music.id,
			name: music.name,
			artist: music.artist,
			file_key: music.file_key,
			cover_file_key: music.cover_file_key,
			background_color: image.background_color,
			created_at: music.created_at,
			updated_at: music.updated_at
		})
		.from(music)
		.leftJoin(image, eq(music.cover_file_key, image.file_key))
		.orderBy(asc(music.created_at), asc(music.id));

	return json({ items });
};
