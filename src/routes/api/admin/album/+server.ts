import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { album } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = await request.json();
	const { name, artist, description, cover_file_key } = body as Record<string, string>;

	if (!name) return json({ error: '缺少必填字段: name' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const record = await db
		.insert(album)
		.values({
			name,
			artist: artist || null,
			description: description || null,
			cover_file_key: cover_file_key || null
		})
		.returning()
		.get();

	return json(record, { status: 201 });
};

export const PUT: RequestHandler = async ({ url, request, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(album).where(eq(album.id, id)).get();
	if (!existing) return json({ error: '专辑不存在' }, { status: 404 });

	const body = (await request.json()) as Record<string, string | undefined>;
	const updates: Record<string, string | null> = {};

	if (body.name !== undefined) updates.name = body.name;
	if (body.artist !== undefined) updates.artist = body.artist || null;
	if (body.description !== undefined) updates.description = body.description || null;
	if (body.cover_file_key !== undefined) updates.cover_file_key = body.cover_file_key || null;
	updates.updated_at = new Date().toISOString();

	const record = await db.update(album).set(updates).where(eq(album.id, id)).returning().get();
	return json(record);
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(album).where(eq(album.id, id)).get();
	if (!existing) return json({ error: '专辑不存在' }, { status: 404 });

	await db.delete(album).where(eq(album.id, id));
	return json({ success: true });
};
