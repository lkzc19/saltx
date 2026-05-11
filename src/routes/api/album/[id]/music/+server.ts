import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { album, albumMusic, music } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const { id } = params;
	const db = getDb(platform!.env.DB);

	const existing = await db.select().from(album).where(eq(album.id, id)).get();
	if (!existing) return json({ error: '专辑不存在' }, { status: 404 });

	const items = await db
		.select({
			id: music.id,
			name: music.name,
			artist: music.artist,
			version: music.version,
			extension: music.extension,
			cover_file_key: music.cover_file_key,
			created_at: music.created_at,
			updated_at: music.updated_at,
			sort_order: albumMusic.sort_order
		})
		.from(albumMusic)
		.innerJoin(music, eq(albumMusic.music_id, music.id))
		.where(eq(albumMusic.album_id, id))
		.orderBy(albumMusic.sort_order);

	return json({ album: existing, items });
};
