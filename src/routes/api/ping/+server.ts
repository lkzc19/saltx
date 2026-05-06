import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform!.env.DB;
	const bucket = platform!.env.BUCKET;

	const checkD1 = async () => {
		try {
			await db.prepare('SELECT 1').first();
			return { status: 'ok' as const };
		} catch (e) {
			return { status: 'error' as const, message: (e as Error).message };
		}
	};

	const checkR2 = async () => {
		try {
			await bucket.list({ limit: 1 });
			return { status: 'ok' as const };
		} catch (e) {
			return { status: 'error' as const, message: (e as Error).message };
		}
	};

	const [d1, r2] = await Promise.all([checkD1(), checkR2()]);

	const healthy = d1.status === 'ok' && r2.status === 'ok';

	return json(
		{
			status: healthy ? 'ok' : 'degraded',
			d1,
			r2
		},
		{ status: healthy ? 200 : 503 }
	);
};
