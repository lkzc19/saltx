import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { music, nanoid8 } from '$lib/server/db/schema';
import { buildMusicFileKey } from '$lib/utils/music';
import type { RequestHandler } from './$types';

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot === -1 ? '' : filename.slice(dot + 1);
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const formData = await request.formData();

	const name = formData.get('name')?.toString();
	const artist = formData.get('artist')?.toString();
	const version = formData.get('version')?.toString();
	const file = formData.get('file') as File | null;

	if (!name || !artist || !version || !file) {
		const missing = [
			!name && 'name',
			!artist && 'artist',
			!version && 'version',
			!file && 'file'
		]
			.filter(Boolean)
			.join(', ');
		return json({ error: `缺少必填字段: ${missing}` }, { status: 400 });
	}

	const id = nanoid8();
	const ext = getExtension(file.name);
	const fileKey = buildMusicFileKey(id, version, ext);

	const bucket = platform!.env.BUCKET;
	const db = getDb(platform!.env.DB);

	await bucket.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	const record = await db
		.insert(music)
		.values({
			id,
			name,
			artist,
			version,
			extension: ext
		})
		.returning()
		.get();

	return json({ ...record, file_key: fileKey }, { status: 201 });
};
