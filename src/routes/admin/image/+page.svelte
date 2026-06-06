<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ImageTable from './_components/ImageTable.svelte';
	import ImageDetail from './_components/ImageDetail.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Scrollbar from '$lib/components/Scrollbar.svelte';
	import { adminState } from '$lib/stores/admin.svelte';

	let { data } = $props();
	let imageDetail: { reset: () => void } | undefined = $state(undefined);

	function handlePageChange(p: number, ps: number) {
		const sp = new SvelteURLSearchParams(page.url.searchParams);
		sp.set('page', String(p));
		if (ps !== data.pageSize) sp.set('pageSize', String(ps));
		goto(`${resolve('/admin/image', {})}?${sp.toString()}`);
	}

	function handleCreated() {
		adminState.addingImage = false;
		invalidateAll();
	}

	function handleSaved() {
		invalidateAll();
	}

	async function handleDelete(id: string) {
		if (!confirm('确定要删除这张图片吗？')) return;
		await fetch(`/api/admin/image?id=${id}`, { method: 'DELETE' });
		if (adminState.selectedImage?.id === id) {
			adminState.selectedImage = null;
		}
		invalidateAll();
	}

	function handleDeleted() {
		adminState.selectedImage = null;
		invalidateAll();
	}
</script>

<svelte:head>
	<title>图片管理 - SALT X</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1">
		<div class="flex min-w-0 flex-1 flex-col">
			<Scrollbar class="min-h-0 flex-1">
				<div class="p-4">
					<ImageTable
						items={data.items}
						selectedId={adminState.selectedImage?.id ?? null}
						onselect={(item) => (adminState.selectedImage = item)}
						ondelete={handleDelete}
						onadd={() => { imageDetail?.reset(); adminState.addingImage = true; }}
					/>
				</div>
			</Scrollbar>
			<div class="flex min-h-18 items-center border-t border-border-primary px-4">
				<Pagination
					page={data.page}
					pageSize={data.pageSize}
					total={data.total}
					totalPages={data.totalPages}
					onchange={handlePageChange}
				/>
			</div>
		</div>
		<ImageDetail bind:this={imageDetail}
			image={adminState.selectedImage}
			oncreated={handleCreated}
			onsaved={handleSaved}
			ondeleted={handleDeleted}
		/>
	</div>
</div>
