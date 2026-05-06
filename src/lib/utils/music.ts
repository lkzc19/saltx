export function buildMusicFileKey(id: string, version: string, extension: string): string {
	return `music/${id}/${version}.${extension}`;
}

export function buildImageFileKey(id: string, extension: string): string {
	return `image/${id}.${extension}`;
}

export function getR2Url(fileKey: string): string {
	// 统一通过应用路由访问，本地和线上都用 /files/
	return `/files/${fileKey}`;
}

export function getImageUrl(image: { id: string; extension: string }): string {
	const fileKey = buildImageFileKey(image.id, image.extension);
	return getR2Url(fileKey);
}

export function getThumbnailUrl(image: { id: string }): string {
	const fileKey = `image/${image.id}_thumb.jpg`; //缩略图固定 jpg
	return getR2Url(fileKey);
}
