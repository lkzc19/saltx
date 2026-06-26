import { getDb } from '$lib/server/db';
import { announcement } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, platform }) => {
	const db = getDb(platform!.env.DB);
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
	const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 20)));
	const offset = (page - 1) * pageSize;

	const [items, countResult] = await Promise.all([
		db.select().from(announcement).orderBy(desc(announcement.created_at)).limit(pageSize).offset(offset),
		db.$count(announcement)
	]);

	const total = Number(countResult);
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	return { items, page, pageSize, total, totalPages };
};
