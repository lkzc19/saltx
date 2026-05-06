export class R2Store {
	constructor(private bucket: R2Bucket) {}

	async put(
		key: string,
		data: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | null,
		options?: R2PutOptions
	): Promise<R2Object> {
		return this.bucket.put(key, data, options);
	}

	async get(key: string): Promise<R2ObjectBody | null> {
		return this.bucket.get(key);
	}

	async head(key: string): Promise<R2Object | null> {
		return this.bucket.head(key);
	}

	async delete(key: string): Promise<void> {
		await this.bucket.delete(key);
	}

	async list(options?: R2ListOptions): Promise<R2Objects> {
		return this.bucket.list(options);
	}

	async listAll(prefix?: string): Promise<R2Object[]> {
		const objects: R2Object[] = [];
		let cursor: string | undefined;

		do {
			const result: R2Objects = await this.bucket.list({ prefix, cursor, limit: 1000 });
			objects.push(...result.objects);
			cursor = result.truncated ? result.objects[result.objects.length - 1].key : undefined;
		} while (cursor);

		return objects;
	}

	async exists(key: string): Promise<boolean> {
		const head = await this.head(key);
		return head !== null;
	}
}
