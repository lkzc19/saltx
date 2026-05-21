export function getR2Url(fileKey: string): string {
	return `/files/${fileKey.split('/').map(encodeURIComponent).join('/')}`;
}

export function buildMusicFileKey(id: string, extension: string): string {
	return `music/${id}.${extension}`;
}

export function getMusicUrl(fileKey: string): string {
	return getR2Url(fileKey);
}

export function getOriginalUrl(fileKey: string): string {
	return getR2Url(fileKey);
}
