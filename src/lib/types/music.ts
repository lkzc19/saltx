export interface Music {
	id: string;
	name: string;
	artist: string;
	version: string;
	extension: string;
	cover_file_key: string | null;
	created_at: string;
	updated_at: string;
}

export interface Image {
	id: string;
	name: string;
	extension: string;
	aspect_ratio: string;
	file_key: string | null;
	thumbnail_key: string | null;
	created_at: string;
	updated_at: string;
}

export interface MusicListResponse {
	items: Music[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export interface ImageListResponse {
	items: Image[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}
