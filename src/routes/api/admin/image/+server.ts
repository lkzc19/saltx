import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image, nanoid8 } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot === -1 ? '' : filename.slice(dot + 1);
}

function normalizeHex(value: string | null): string | null {
	if (!value) return null;
	const normalized = value.trim().toUpperCase();
	return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();

	const name = formData.get('name')?.toString();
	const aspectRatio = formData.get('aspect_ratio')?.toString() ?? '1:1';
	const backgroundColor = normalizeHex(formData.get('background_color')?.toString() ?? null);
	const file = formData.get('file') as File | null;

	if (!file) {
		return json({ error: '缺少必填字段: file' }, { status: 400 });
	}

	if (aspectRatio !== '1:1' && aspectRatio !== '16:9') {
		return json({ error: '暂仅支持 1:1 和 16:9 比例' }, { status: 400 });
	}

	const fileName = name ?? file.name.replace(/\.[^/.]+$/, '');
	const ext = getExtension(file.name);

	const bucket = platform!.env.BUCKET;
	const db = getDb(platform!.env.DB);

	// 构建 background_colors
	let backgroundColors = null;
	if (backgroundColor) {
		backgroundColors = JSON.stringify({
			auto: [{ color: backgroundColor, algorithm: 'kmeans' }],
			manual: [],
			active: backgroundColor
		});
	}

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
			background_colors: backgroundColors
		})
		.returning()
		.get();

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
	const backgroundColorsRaw = formData.get('background_colors')?.toString();
	const file = formData.get('file') as File | null;

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(image).where(eq(image.id, id)).get();
	if (!existing) return json({ error: '图片不存在' }, { status: 404 });

	if (aspectRatio && aspectRatio !== '1:1' && aspectRatio !== '16:9') {
		return json({ error: '暂仅支持 1:1 和 16:9 比例' }, { status: 400 });
	}

	const updates: Record<string, string | null> = {};
	if (name) updates.name = name;
	if (aspectRatio) updates.aspect_ratio = aspectRatio;

	// 更新背景色
	if (backgroundColorsRaw !== undefined) {
		try {
			JSON.parse(backgroundColorsRaw); // 验证 JSON 格式
			updates.background_colors = backgroundColorsRaw;
		} catch {
			// 忽略无效的 JSON
		}
	}

	updates.updated_at = new Date().toISOString();

	if (file) {
		const bucket = platform!.env.BUCKET;
		const ext = getExtension(file.name);
		const newFileKey = `image/${id}.${ext}`;

		if (existing.file_key) {
			await bucket.delete(existing.file_key);
		}

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
	if (existing.file_key) {
		await bucket.delete(existing.file_key);
	}

	await db.delete(image).where(eq(image.id, id));

	return json({ success: true });
};
