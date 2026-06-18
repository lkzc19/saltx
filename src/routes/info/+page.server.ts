import { getDb } from '$lib/server/db';
import { announcement } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const items = await db
		.select()
		.from(announcement)
		.orderBy(desc(announcement.is_pinned), desc(announcement.created_at))
		.all();

	return { items };
};
