<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import AlbumSearchBar from '$lib/components/AlbumSearchBar.svelte';
	import AlbumGrid from '$lib/components/AlbumGrid.svelte';
	import AlbumDetail from '$lib/components/AlbumDetail.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import AlbumCreateModal from '$lib/components/AlbumCreateModal.svelte';
	import { adminState } from '$lib/stores/admin.svelte';
	import type { Album } from '$lib/types/music';

	let { data } = $props();
	let createOpen = $state(false);

	function handleSearch(filters: { name: string; artist: string }) {
		const sp = new SvelteURLSearchParams();
		if (filters.name) sp.set('name', filters.name);
		if (filters.artist) sp.set('artist', filters.artist);
		const qs = sp.toString();
		goto(qs ? resolve(`/admin/album?${qs}`) : resolve('/admin/album'));
	}

	function handlePageChange(p: number, ps: number) {
		const sp = new SvelteURLSearchParams(page.url.searchParams);
		sp.set('page', String(p));
		if (ps !== data.pageSize) sp.set('pageSize', String(ps));
		goto(resolve(`/admin/album?${sp.toString()}`));
	}

	function handleCreated(album: Album) {
		adminState.selectedAlbum = album;
		invalidateAll();
	}

	function handleSaved(updated: Album) {
		adminState.selectedAlbum = updated;
		invalidateAll();
	}

	function handleDeleted() {
		adminState.selectedAlbum = null;
		invalidateAll();
	}
</script>

<svelte:head>
	<title>专辑管理 - SALT X</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1">
		<div class="flex min-w-0 flex-1 flex-col p-6">
			<AlbumSearchBar filters={data.filters} onsearch={handleSearch} oncreate={() => (createOpen = true)} />
			<AlbumGrid items={data.items} selectedId={adminState.selectedAlbum?.id ?? null} onselect={(item) => (adminState.selectedAlbum = item)} />
			<Pagination
				page={data.page}
				pageSize={data.pageSize}
				total={data.total}
				totalPages={data.totalPages}
				onchange={handlePageChange}
			/>
		</div>
		<AlbumDetail
			album={adminState.selectedAlbum}
			onsaved={handleSaved}
			ondeleted={handleDeleted}
			onmusic_updated={invalidateAll}
		/>
	</div>
</div>

<AlbumCreateModal bind:open={createOpen} oncreated={handleCreated} />
