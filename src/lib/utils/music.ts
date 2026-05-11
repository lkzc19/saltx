// 音乐文件路径
export function getMusicUrl(id: string, version: string, extension: string): string {
	return `/files/music/${id}/${version}.${extension}`;
}

// 兼容旧代码
export function buildMusicFileKey(id: string, version: string, extension: string): string {
	return getMusicUrl(id, version, extension);
}

export function getR2Url(fileKey: string): string {
	return `/files/${fileKey}`;
}

// 图片文件路径（R2 完整路径）
export function getImageThumbnailUrl(fileKey: string): string {
	return `/files/${fileKey}`;
}

// 兼容旧代码
export function getThumbnailUrl(id: string): string {
	return `/files/image/${id}_thumb.webp`;
}

export function getOriginalUrl(id: string, extension: string): string {
	return `/files/image/${id}.${extension}`;
}