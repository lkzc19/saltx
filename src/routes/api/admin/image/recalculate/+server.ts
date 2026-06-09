import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function normalizeHex(value: string | null): string | null {
	if (!value) return null;
	const normalized = value.trim().toUpperCase();
	return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export const PUT: RequestHandler = async ({ url, request, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const body = (await request.json()) as { color?: string };
	const color = normalizeHex(body.color ?? null);
	if (!color) return json({ error: '缺少 color 参数或格式不正确' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(image).where(eq(image.id, id)).get();
	if (!existing) return json({ error: '图片不存在' }, { status: 404 });

	// 解析现有的 background_colors
	let bgColors: { auto: { color: string; algorithm: string }[]; manual: string[]; active: string } = {
		auto: [],
		manual: [],
		active: color
	};

	if (existing.background_colors) {
		try {
			bgColors = JSON.parse(existing.background_colors);
		} catch {
			// 忽略解析错误，使用默认值
		}
	}

	// 更新 auto 数组中的 kmeans 颜色
	const kmeansIndex = bgColors.auto.findIndex((c) => c.algorithm === 'kmeans');
	if (kmeansIndex >= 0) {
		bgColors.auto[kmeansIndex].color = color;
	} else {
		bgColors.auto.unshift({ color, algorithm: 'kmeans' });
	}

	// 如果 active 不在任何颜色列表中，设为新的 kmeans 颜色
	const allColors = [...bgColors.auto.map((c) => c.color), ...bgColors.manual];
	if (!allColors.includes(bgColors.active)) {
		bgColors.active = color;
	}

	const record = await db
		.update(image)
		.set({
			background_colors: JSON.stringify(bgColors),
			updated_at: new Date().toISOString()
		})
		.where(eq(image.id, id))
		.returning()
		.get();

	return json(record);
};
