import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image, nanoid8 } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot === -1 ? '' : filename.slice(dot + 1);
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();

	const name = formData.get('name')?.toString();
	const aspectRatio = formData.get('aspect_ratio')?.toString() ?? '1:1';
	const file = formData.get('file') as File | null;
	const thumbnail = formData.get('thumbnail') as File | null;

	if (!file) {
		return json({ error: '缺少必填字段: file' }, { status: 400 });
	}

	if (aspectRatio !== '1:1') {
		return json({ error: '暂仅支持 1:1 比例' }, { status: 400 });
	}

	const fileName = name ?? file.name.replace(/\.[^/.]+$/, '');
	const ext = getExtension(file.name);

	const bucket = platform!.env.BUCKET;
	const db = getDb(platform!.env.DB);

	// 插入记录（id 和 file_key 相同）
	const id = nanoid8();
	const record = await db
		.insert(image)
		.values({
			id,
			file_key: id,
			name: fileName,
			extension: ext,
			aspect_ratio: aspectRatio
		})
		.returning()
		.get();

	// 上传原图到 R2
	const fileKey = `image/${id}.${ext}`;
	await bucket.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	// 上传缩略图（如果提供）
	if (thumbnail) {
		const thumbnailKey = `image/${id}_thumb.webp`;
		await bucket.put(thumbnailKey, await thumbnail.arrayBuffer(), {
			httpMetadata: { contentType: 'image/webp' }
		});
	}

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
	const fileKey = `image/${existing.id}.${existing.extension}`;
	await bucket.delete(fileKey);
	// 删除缩略图
	const thumbnailKey = `image/${existing.id}_thumb.webp`;
	await bucket.delete(thumbnailKey);

	await db.delete(image).where(eq(image.id, id));

	return json({ success: true });
};