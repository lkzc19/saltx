import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { music } from '$lib/server/db/schema';
import { like, count, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, platform }) => {
	const db = getDb(platform!.env.DB);

	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
	const name = url.searchParams.get('name') ?? undefined;
	const artist = url.searchParams.get('artist') ?? undefined;
	const id = url.searchParams.get('id') ?? undefined;

	const conditions = [];
	if (name) conditions.push(like(music.name, `%${name}%`));
	if (artist) conditions.push(like(music.artist, `%${artist}%`));
	if (id) conditions.push(like(music.id, `%${id}%`));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [{ total }] = await db.select({ total: count() }).from(music).where(where);

	const items = await db
		.select()
		.from(music)
		.where(where)
		.orderBy(desc(music.created_at), desc(music.id))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return {
		items,
		page,
		pageSize,
		total,
		totalPages: Math.ceil(total / pageSize),
		filters: { name: name ?? '', artist: artist ?? '', id: id ?? '' }
	};
};
