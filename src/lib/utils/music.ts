export function getR2Url(fileKey: string): string {
	return `/files/${fileKey.split('/').map(encodeURIComponent).join('/')}`;
}

export function buildMusicFileKey(id: string, filename: string): string {
	const dot = filename.lastIndexOf('.');
	const ext = dot === -1 ? '' : filename.slice(dot);
	return `music/${id}${ext}`;
}
