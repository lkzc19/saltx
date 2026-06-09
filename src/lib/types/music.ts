export interface Music {
	id: string;
	name: string;
	artist: string;
	file_key: string;
	cover_file_key: string | null;
	background_color?: string | null;
	created_at: string;
	updated_at: string;
}

export interface Image {
	id: string;
	file_key: string;
	name: string;
	extension: string;
	aspect_ratio: string;
	background_colors: string | null;
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
