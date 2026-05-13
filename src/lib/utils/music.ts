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

// 图片缩略图
export function getThumbnailUrl(fileKey: string): string {
	if (fileKey.includes('/')) {
		return `/files/${fileKey.replace(/(\.[^/.]+)$/, '_thumb.webp')}`;
	}
	return `/files/image/${fileKey}_thumb.webp`;
}

// 图片原图（全尺寸）
export function getOriginalUrl(fileKey: string): string {
	if (fileKey.includes('/')) {
		return `/files/${fileKey}`;
	}
	return `/files/image/${fileKey}`;
}

// 兼容旧代码
export function getImageThumbnailUrl(fileKey: string): string {
	return getThumbnailUrl(fileKey);
}