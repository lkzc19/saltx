export interface Announcement {
	id: string;
	title: string;
	content: string | null;
	cover_file_key: string | null;
	category: string;
	is_recommended: string;
	created_at: string;
	updated_at: string;
}
