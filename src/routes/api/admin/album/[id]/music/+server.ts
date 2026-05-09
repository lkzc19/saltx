import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { album, albumMusic, music } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
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

	return json({ items });
};

export const POST: RequestHandler = async ({ params, request, platform }) => {
	const { id } = params;
	const db = getDb(platform!.env.DB);

	const existing = await db.select().from(album).where(eq(album.id, id)).get();
	if (!existing) return json({ error: '专辑不存在' }, { status: 404 });

	const body = await request.json();
	const { music_ids } = body as { music_ids: string[] };
	if (!Array.isArray(music_ids) || music_ids.length === 0) {
		return json({ error: '缺少参数: music_ids' }, { status: 400 });
	}

	const currentRows = await db
		.select({ music_id: albumMusic.music_id, sort_order: albumMusic.sort_order })
		.from(albumMusic)
		.where(eq(albumMusic.album_id, id));

	const existingIds = new Set(currentRows.map((r) => r.music_id));
	const maxOrder = currentRows.reduce((m, r) => Math.max(m, r.sort_order), -1);

	const toInsert = music_ids
		.filter((mid) => !existingIds.has(mid))
		.map((mid, i) => ({ album_id: id, music_id: mid, sort_order: maxOrder + 1 + i }));

	if (toInsert.length > 0) {
		await db.insert(albumMusic).values(toInsert);
	}

	return json({ added: toInsert.length });
};

export const DELETE: RequestHandler = async ({ params, url, platform }) => {
	const { id } = params;
	const music_id = url.searchParams.get('music_id');
	if (!music_id) return json({ error: '缺少参数: music_id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	await db
		.delete(albumMusic)
		.where(and(eq(albumMusic.album_id, id), eq(albumMusic.music_id, music_id)));

	return json({ success: true });
};
