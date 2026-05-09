import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { album, albumMusic } from '$lib/server/db/schema';
import { like, count, and, eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, platform }) => {
	const db = getDb(platform!.env.DB);

	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
	const name = url.searchParams.get('name') ?? undefined;
	const artist = url.searchParams.get('artist') ?? undefined;

	const conditions = [];
	if (name) conditions.push(like(album.name, `%${name}%`));
	if (artist) conditions.push(like(album.artist, `%${artist}%`));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [{ total }] = await db.select({ total: count() }).from(album).where(where);

	const items = await db
		.select({
			id: album.id,
			name: album.name,
			artist: album.artist,
			description: album.description,
			cover_file_key: album.cover_file_key,
			created_at: album.created_at,
			updated_at: album.updated_at,
			music_count: sql<number>`count(${albumMusic.music_id})`
		})
		.from(album)
		.leftJoin(albumMusic, eq(album.id, albumMusic.album_id))
		.where(where)
		.groupBy(album.id)
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return {
		items,
		page,
		pageSize,
		total,
		totalPages: Math.ceil(total / pageSize),
		filters: { name: name ?? '', artist: artist ?? '' }
	};
};
