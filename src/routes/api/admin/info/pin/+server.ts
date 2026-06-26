import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { announcement } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(announcement).where(eq(announcement.id, id)).get();
	if (!existing) return json({ error: '公告不存在' }, { status: 404 });

	const newPinned = existing.is_recommended === 'true' ? 'false' : 'true';

	const record = await db
		.update(announcement)
		.set({ is_recommended: newPinned, updated_at: new Date().toISOString() })
		.where(eq(announcement.id, id))
		.returning()
		.get();

	return json(record);
};
