import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const MIME_TYPE_MAP: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp'
};

export const GET: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const record = await db.select().from(image).where(eq(image.id, id)).get();

	if (!record) return json({ error: '图片不存在' }, { status: 404 });
	if (!record.thumbnail_key) return json({ error: '缩略图不存在' }, { status: 404 });

	const bucket = platform!.env.BUCKET;
	const object = await bucket.get(record.thumbnail_key);

	if (!object) return json({ error: '缩略图文件不存在' }, { status: 404 });

	const ext = record.extension;
	const contentType = MIME_TYPE_MAP[ext] ?? 'image/jpeg';

	return new Response(object.body, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=86400'
		}
	});
};