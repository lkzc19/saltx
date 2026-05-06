import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image, nanoid8 } from '$lib/server/db/schema';
import { buildImageFileKey } from '$lib/utils/music';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot === -1 ? '' : filename.slice(dot + 1);
}

const MIME_TYPE_MAP: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp'
};

function getMimeType(ext: string): string {
	return MIME_TYPE_MAP[ext] ?? 'image/jpeg';
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();

	const name = formData.get('name')?.toString();
	const aspectRatio = formData.get('aspect_ratio')?.toString() ?? '1:1';
	const file = formData.get('file') as File | null;

	if (!name || !file) {
		const missing = [!name && 'name', !file && 'file'].filter(Boolean).join(', ');
		return json({ error: `缺少必填字段: ${missing}` }, { status: 400 });
	}

	if (aspectRatio !== '1:1') {
		return json({ error: '暂仅支持 1:1 比例' }, { status: 400 });
	}

	const id = nanoid8();
	const ext = getExtension(file.name);
	const fileKey = buildImageFileKey(id, ext);

	const bucket = platform!.env.BUCKET;
	const db = getDb(platform!.env.DB);

	// 上传原图
	const arrayBuffer = await file.arrayBuffer();
	await bucket.put(fileKey, arrayBuffer, {
		httpMetadata: { contentType: file.type }
	});

	const record = await db
		.insert(image)
		.values({
			id,
			name,
			extension: ext,
			aspect_ratio: aspectRatio
		})
		.returning()
		.get();

	return json(record, { status: 201 });
};

export const GET: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const record = await db.select().from(image).where(eq(image.id, id)).get();

	if (!record) return json({ error: '图片不存在' }, { status: 404 });

	return json(record);
};

export const PUT: RequestHandler = async ({ url, request, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const body = await request.json() as { name?: string; aspect_ratio?: string };

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(image).where(eq(image.id, id)).get();
	if (!existing) return json({ error: '图片不存在' }, { status: 404 });

	if (body.aspect_ratio && body.aspect_ratio !== '1:1') {
		return json({ error: '暂仅支持 1:1 比例' }, { status: 400 });
	}

	const updates: Record<string, string> = {};
	if (body.name) updates.name = body.name;
	if (body.aspect_ratio) updates.aspect_ratio = body.aspect_ratio;
	updates.updated_at = new Date().toISOString();

	const record = await db
		.update(image)
		.set(updates)
		.where(eq(image.id, id))
		.returning()
		.get();

	return json(record);
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(image).where(eq(image.id, id)).get();
	if (!existing) return json({ error: '图片不存在' }, { status: 404 });

	const bucket = platform!.env.BUCKET;
	// 删除原图
	await bucket.delete(buildImageFileKey(existing.id, existing.extension));
	// 删除缩略图
	if (existing.thumbnail_key) {
		await bucket.delete(existing.thumbnail_key);
	}

	await db.delete(image).where(eq(image.id, id));

	return json({ success: true });
};