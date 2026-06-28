import type { RequestHandler } from './$types';

function parseRangeHeader(header: string): { offset?: number; length?: number; suffix?: number } | null {
	const m = header.match(/^bytes=(\d*)-(\d*)$/);
	if (!m) return null;
	const start = m[1] !== '' ? parseInt(m[1]) : undefined;
	const end = m[2] !== '' ? parseInt(m[2]) : undefined;
	if (start === undefined && end === undefined) return null;
	if (start === undefined) return { suffix: end };
	if (end === undefined) return { offset: start };
	return { offset: start, length: end - start + 1 };
}

export const GET: RequestHandler = async ({ params, request, platform }) => {
	const r2 = platform!.env.BUCKET;
	const path = params.path;

	if (!path) {
		return new Response('Missing path', { status: 400 });
	}

	const rangeHeader = request.headers.get('range');

	if (rangeHeader) {
		const range = parseRangeHeader(rangeHeader);
		if (!range) {
			return new Response('Invalid Range', { status: 416 });
		}

		const obj = await r2.get(path, { range: range as R2Range });
		if (!obj) {
			return new Response('Not found', { status: 404 });
		}

		const contentType = obj.httpMetadata?.contentType || 'application/octet-stream';
		const size = obj.size;
		const start = range.offset ?? 0;
		const end = range.length != null ? start + range.length - 1 : size - 1;

		return new Response(obj.body, {
			status: 206,
			headers: {
				'Content-Type': contentType,
				'Accept-Ranges': 'bytes',
				'Content-Range': `bytes ${start}-${end}/${size}`,
				'Content-Length': String(end - start + 1),
				'Cache-Control': 'public, max-age=31536000'
			}
		});
	}

	const obj = await r2.get(path);
	if (!obj) {
		return new Response('Not found', { status: 404 });
	}

	return new Response(obj.body, {
		headers: {
			'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
			'Accept-Ranges': 'bytes',
			'Content-Length': String(obj.size),
			'Cache-Control': 'public, max-age=31536000'
		}
	});
};
