<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ImageGrid from './_components/ImageGrid.svelte';
	import ImagePreview from './_components/ImagePreview.svelte';
	import ImageUploadModal from './_components/ImageUploadModal.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageSearchBar from './_components/ImageSearchBar.svelte';
	import type { Image } from '$lib/types/music';

	let { data } = $props();
	let uploadOpen = $state(false);
	let previewImage = $state<Image | null>(null);

	function handleSearch(filters: { name: string }) {
		if (filters.name) {
			goto(`${resolve('/admin/image', {})}?name=${encodeURIComponent(filters.name)}`);
		} else {
			goto(resolve('/admin/image', {}));
		}
	}

	function handlePageChange(p: number, ps: number) {
		const sp = new SvelteURLSearchParams(page.url.searchParams);
		sp.set('page', String(p));
		if (ps !== data.pageSize) sp.set('pageSize', String(ps));
		goto(`${resolve('/admin/image', {})}?${sp.toString()}`);
	}

	function handleSelect(item: Image) {
		previewImage = item;
	}

	function handleUploaded() {
		invalidateAll();
	}

	async function handleDelete(id: string) {
		if (!confirm('确定要删除这张图片吗？')) return;
		await fetch(`/api/admin/image?id=${id}`, { method: 'DELETE' });
		previewImage = null;
		invalidateAll();
	}
</script>

<svelte:head>
	<title>图片管理 - SALT X</title>
</svelte:head>

<div class="flex h-full">
	<div class="flex min-w-0 flex-1 flex-col">
		<div class="flex-1 overflow-auto p-4">
		<ImageSearchBar filters={data.filters} onsearch={handleSearch} onupload={() => (uploadOpen = true)} />
		<ImageGrid items={data.items} onselect={handleSelect} />
		</div>
				<div class="flex min-h-18 items-center border-t border-border-primary px-4">
				<Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onchange={handlePageChange} />
			</div>
	</div>
</div>

<ImagePreview image={previewImage} onclose={() => (previewImage = null)} ondelete={handleDelete} />
<ImageUploadModal bind:open={uploadOpen} onuploaded={handleUploaded} />
