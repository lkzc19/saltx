import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { music } from '$lib/server/db/schema';
import { like, count, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const db = getDb(platform!.env.DB);

	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));
	const name = url.searchParams.get('name') ?? undefined;
	const artist = url.searchParams.get('artist') ?? undefined;

	const conditions = [];
	if (name) conditions.push(like(music.name, `%${name}%`));
	if (artist) conditions.push(like(music.artist, `%${artist}%`));

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [{ total }] = await db.select({ total: count() }).from(music).where(where);

	const items = await db
		.select()
		.from(music)
		.where(where)
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	return json({
		items,
		page,
		pageSize,
		total,
		totalPages: Math.ceil(total / pageSize)
	});
};
