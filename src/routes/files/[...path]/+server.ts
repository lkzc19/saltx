import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const r2 = platform!.env.BUCKET;
	const path = params.path;

	if (!path) {
		return new Response('Missing path', { status: 400 });
	}

	const obj = await r2.get(path);
	if (!obj) {
		return new Response('Not found', { status: 404 });
	}

	return new Response(obj.body, {
		headers: {
			'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
			'Cache-Control': 'public, max-age=31536000'
		}
	});
};