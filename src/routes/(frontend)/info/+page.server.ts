import { getDb } from '$lib/server/db';
import { announcement } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const featured = await db
		.select()
		.from(announcement)
		.where(eq(announcement.is_recommended, 'true'))
		.orderBy(desc(announcement.created_at))
		.all();

	const allItems = await db
		.select()
		.from(announcement)
		.orderBy(desc(announcement.created_at))
		.all();

	return { featured, allItems };
};
