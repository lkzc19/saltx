import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image, nanoid8 } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot === -1 ? '' : filename.slice(dot + 1);
}

function normalizeBackgroundColor(value: string | null): string | null {
	if (!value) return null;
	const normalized = value.trim().toUpperCase();
	return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();

	const name = formData.get('name')?.toString();
	const aspectRatio = formData.get('aspect_ratio')?.toString() ?? '1:1';
	const backgroundColor = normalizeBackgroundColor(formData.get('background_color')?.toString() ?? null);
	const file = formData.get('file') as File | null;

	if (!file) {
		return json({ error: '缺少必填字段: file' }, { status: 400 });
	}

	if (aspectRatio !== '1:1') {
		return json({ error: '暂仅支持 1:1 比例' }, { status: 400 });
	}

	if (formData.has('background_color') && !backgroundColor) {
		return json({ error: 'background_color 格式不正确，需为 HEX 色值' }, { status: 400 });
	}

	const fileName = name ?? file.name.replace(/\.[^/.]+$/, '');
	const ext = getExtension(file.name);

	const bucket = platform!.env.BUCKET;
	const db = getDb(platform!.env.DB);

	// 插入记录（file_key 存 R2 完整路径）
	const id = nanoid8();
	const fileKey = `image/${id}.${ext}`;
	const record = await db
		.insert(image)
		.values({
			id,
			file_key: fileKey,
			name: fileName,
			extension: ext,
			aspect_ratio: aspectRatio,
			background_color: backgroundColor
		})
		.returning()
		.get();

	// 上传原图到 R2
	await bucket.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

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

	const formData = await request.formData();
	const name = formData.get('name')?.toString();
	const aspectRatio = formData.get('aspect_ratio')?.toString();
	const backgroundColor = normalizeBackgroundColor(formData.get('background_color')?.toString() ?? null);
	const file = formData.get('file') as File | null;

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(image).where(eq(image.id, id)).get();
	if (!existing) return json({ error: '图片不存在' }, { status: 404 });

	if (aspectRatio && aspectRatio !== '1:1') {
		return json({ error: '暂仅支持 1:1 比例' }, { status: 400 });
	}

	const updates: Record<string, string> = {};
	if (name) updates.name = name;
	if (aspectRatio) updates.aspect_ratio = aspectRatio;
	if (backgroundColor) updates.background_color = backgroundColor;
	updates.updated_at = new Date().toISOString();

	// 如果有新文件，替换原图
	if (file) {
		const bucket = platform!.env.BUCKET;
		const ext = getExtension(file.name);
		const newFileKey = `image/${id}.${ext}`;

		// 删除旧文件
		if (existing.file_key) {
			await bucket.delete(existing.file_key);
		}

		// 上传新文件
		await bucket.put(newFileKey, await file.arrayBuffer(), {
			httpMetadata: { contentType: file.type }
		});

		updates.file_key = newFileKey;
		updates.extension = ext;
	}

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
	if (existing.file_key) {
		await bucket.delete(existing.file_key);
	}

	await db.delete(image).where(eq(image.id, id));

	return json({ success: true });
};
