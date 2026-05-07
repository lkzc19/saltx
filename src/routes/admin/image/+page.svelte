<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ImagePreview from '$lib/components/ImagePreview.svelte';
	import ImageUploadModal from '$lib/components/ImageUploadModal.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageSearchBar from '$lib/components/ImageSearchBar.svelte';
	import { adminState } from '$lib/stores/admin.svelte';
	import type { Image } from '$lib/types/music';

	let { data } = $props();
	let uploadOpen = $state(false);
	let previewImage = $state<Image | null>(null);

	function handleSearch(filters: { name: string }) {
		const params = new URLSearchParams();
		if (filters.name) params.set('name', filters.name);
		goto(`/admin/image?${params.toString()}`);
	}

	function handlePageChange(p: number, ps: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(p));
		if (ps !== data.pageSize) params.set('pageSize', String(ps));
		goto(`/admin/image?${params.toString()}`);
	}

	function handleSelect(item: Image) {
		previewImage = item;
	}

	function handleUploaded() {
		goto(page.url.href, { invalidateAll: true });
	}

	async function handleDelete(id: string) {
		if (!confirm('确定要删除这张图片吗？')) return;
		await fetch(`/api/image?id=${id}`, { method: 'DELETE' });
		previewImage = null;
		goto(page.url.href, { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>图片管理 - SALT X</title>
</svelte:head>

<div class="flex h-full">
	<div class="flex min-w-0 flex-1 flex-col p-6">
		<ImageSearchBar filters={data.filters} onsearch={handleSearch} onupload={() => (uploadOpen = true)} />
		<ImageGrid items={data.items} onselect={handleSelect} />
		<Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onchange={handlePageChange} />
	</div>
</div>

<ImagePreview image={previewImage} onclose={() => (previewImage = null)} ondelete={handleDelete} />
<ImageUploadModal bind:open={uploadOpen} onuploaded={handleUploaded} />