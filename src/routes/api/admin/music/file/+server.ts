import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildMusicFileKey } from '$lib/utils/music';

const MIME_TYPES: Record<string, string> = {
	mp3: 'audio/mpeg',
	flac: 'audio/flac',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	aac: 'audio/aac',
	m4a: 'audio/mp4',
	wma: 'audio/x-ms-wma'
};

export const GET: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	const version = url.searchParams.get('version');
	const ext = url.searchParams.get('ext');

	if (!id || !version || !ext) {
		return json({ error: '缺少参数: id, version, ext' }, { status: 400 });
	}

	const fileKey = buildMusicFileKey(id, version, ext);
	const bucket = platform!.env.BUCKET;
	const object = await bucket.get(fileKey);

	if (!object) {
		return json({ error: '文件不存在' }, { status: 404 });
	}

	const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

	return new Response(object.body, {
		headers: {
			'Content-Type': contentType,
			'Content-Length': String(object.size),
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
