import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { album, albumMusic, image } from '$lib/server/db/schema';
import { count, eq, sql } from 'drizzle-orm';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const [{ total }] = await db.select({ total: count() }).from(album);

	const items = await db
		.select({
			id: album.id,
			name: album.name,
			artist: album.artist,
			description: album.description,
			cover_file_key: album.cover_file_key,
			cover_extension: image.extension,
			created_at: album.created_at,
			updated_at: album.updated_at,
			music_count: sql<number>`count(${albumMusic.music_id})`
		})
		.from(album)
		.leftJoin(albumMusic, eq(album.id, albumMusic.album_id))
		.leftJoin(image, eq(album.cover_file_key, image.file_key))
		.groupBy(album.id)
		.orderBy(album.created_at)
		.limit(PAGE_SIZE)
		.offset(0);

	return {
		items,
		page: 1,
		pageSize: PAGE_SIZE,
		total,
		totalPages: Math.ceil(total / PAGE_SIZE)
	};
};