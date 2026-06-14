import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { announcement, nanoid8 } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();

	const title = formData.get('title')?.toString();
	const content = formData.get('content')?.toString() || null;
	const coverFileKey = formData.get('cover_file_key')?.toString() || null;
	const isPinned = formData.get('is_pinned')?.toString() ?? 'false';

	if (!title) {
		return json({ error: '缺少必填字段: title' }, { status: 400 });
	}

	const id = nanoid8();
	const db = getDb(platform!.env.DB);

	const record = await db
		.insert(announcement)
		.values({
			id,
			title,
			content,
			cover_file_key: coverFileKey,
			is_pinned: isPinned
		})
		.returning()
		.get();

	return json(record, { status: 201 });
};

export const PUT: RequestHandler = async ({ url, request, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(announcement).where(eq(announcement.id, id)).get();
	if (!existing) return json({ error: '公告不存在' }, { status: 404 });

	const formData = await request.formData();
	const title = formData.get('title')?.toString();
	const content = formData.get('content')?.toString();
	const coverFileKey = formData.get('cover_file_key')?.toString();
	const isPinned = formData.get('is_pinned')?.toString();

	const updates: Record<string, string | null> = {};
	if (title) updates.title = title;
	if (content !== undefined) updates.content = content || null;
	if (coverFileKey !== undefined) updates.cover_file_key = coverFileKey || null;
	if (isPinned !== undefined) updates.is_pinned = isPinned;
	updates.updated_at = new Date().toISOString();

	const record = await db
		.update(announcement)
		.set(updates)
		.where(eq(announcement.id, id))
		.returning()
		.get();

	return json(record);
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(announcement).where(eq(announcement.id, id)).get();
	if (!existing) return json({ error: '公告不存在' }, { status: 404 });

	await db.delete(announcement).where(eq(announcement.id, id));

	return json({ success: true });
};
