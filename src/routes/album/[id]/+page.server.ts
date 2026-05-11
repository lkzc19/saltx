import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { album, albumMusic, music, image } from '$lib/server/db/schema';
import { eq, lt, gt, asc, desc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = getDb(platform!.env.DB);

	const current = await db.select().from(album).where(eq(album.id, params.id)).get();
	if (!current) throw error(404, '专辑不存在');

	// 获取专辑封面扩展名
	let coverExtension: string | null = null;
	if (current.cover_file_key) {
		const coverImg = await db
			.select({ extension: image.extension })
			.from(image)
			.where(eq(image.file_key, current.cover_file_key))
			.get();
		coverExtension = coverImg?.extension ?? null;
	}

	const tracks = await db
		.select({
			id: music.id,
			name: music.name,
			artist: music.artist,
			version: music.version,
			extension: music.extension,
			cover_file_key: music.cover_file_key,
			sort_order: albumMusic.sort_order
		})
		.from(albumMusic)
		.innerJoin(music, eq(albumMusic.music_id, music.id))
		.where(eq(albumMusic.album_id, params.id))
		.orderBy(asc(albumMusic.sort_order));

	// 为每首歌曲获取封面扩展名
	const tracksWithCover = await Promise.all(
		tracks.map(async (track) => {
			let trackCoverExt: string | null = null;
			if (track.cover_file_key) {
				const coverImg = await db
					.select({ extension: image.extension })
					.from(image)
					.where(eq(image.file_key, track.cover_file_key))
					.get();
				trackCoverExt = coverImg?.extension ?? null;
			}
			return { ...track, cover_extension: trackCoverExt };
		})
	);

	const prev = await db
		.select({ id: album.id, name: album.name, cover_file_key: album.cover_file_key })
		.from(album)
		.where(lt(album.created_at, current.created_at))
		.orderBy(desc(album.created_at))
		.limit(1)
		.get();

	const next = await db
		.select({ id: album.id, name: album.name, cover_file_key: album.cover_file_key })
		.from(album)
		.where(gt(album.created_at, current.created_at))
		.orderBy(asc(album.created_at))
		.limit(1)
		.get();

	return {
		current: { ...current, cover_extension: coverExtension },
		tracks: tracksWithCover,
		prev: prev ?? null,
		next: next ?? null
	};
};