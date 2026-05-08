import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { music, nanoid8 } from '$lib/server/db/schema';
import { buildMusicFileKey } from '$lib/utils/music';
import { eq } from 'drizzle-orm';
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
	const coverFileKey = formData.get('cover_file_key')?.toString() || null;

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
			extension: ext,
			cover_file_key: coverFileKey
		})
		.returning()
		.get();

	return json({ ...record, file_key: fileKey }, { status: 201 });
};

export const PUT: RequestHandler = async ({ url, request, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(music).where(eq(music.id, id)).get();
	if (!existing) return json({ error: '音乐不存在' }, { status: 404 });

	const formData = await request.formData();
	const name = formData.get('name')?.toString();
	const artist = formData.get('artist')?.toString();
	const coverFileKey = formData.get('cover_file_key')?.toString();
	const newFile = formData.get('file') as File | null;
	const newVersion = formData.get('version')?.toString();

	const updates: Record<string, string | null> = {};
	if (name) updates.name = name;
	if (artist) updates.artist = artist;
	// 空字符串表示清除封面
	if (coverFileKey !== undefined) updates.cover_file_key = coverFileKey || null;

	if (newFile) {
		const newExt = getExtension(newFile.name);
		const version = newVersion || existing.version;
		const oldKey = buildMusicFileKey(existing.id, existing.version, existing.extension);
		const newKey = buildMusicFileKey(existing.id, version, newExt);

		const bucket = platform!.env.BUCKET;
		await bucket.put(newKey, await newFile.arrayBuffer(), {
			httpMetadata: { contentType: newFile.type }
		});
		if (oldKey !== newKey) {
			await bucket.delete(oldKey);
		}
		updates.version = version;
		updates.extension = newExt;
	}

	updates.updated_at = new Date().toISOString();

	const record = await db
		.update(music)
		.set(updates)
		.where(eq(music.id, id))
		.returning()
		.get();

	return json(record);
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: '缺少参数: id' }, { status: 400 });

	const db = getDb(platform!.env.DB);
	const existing = await db.select().from(music).where(eq(music.id, id)).get();
	if (!existing) return json({ error: '音乐不存在' }, { status: 404 });

	const bucket = platform!.env.BUCKET;
	const fileKey = buildMusicFileKey(existing.id, existing.version, existing.extension);
	await bucket.delete(fileKey);

	await db.delete(music).where(eq(music.id, id));

	return json({ success: true });
};
