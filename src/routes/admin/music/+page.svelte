<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import SearchBar from './_components/SearchBar.svelte';
	import MusicTable from './_components/MusicTable.svelte';
	import MusicDetail from './_components/MusicDetail.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import UploadModal from './_components/UploadModal.svelte';
	import { adminState, playerState } from '$lib/stores/admin.svelte';
	import type { Music } from '$lib/types/music';

	let { data } = $props();
	let uploadOpen = $state(false);

	function handleSearch(filters: { name: string; artist: string; id: string }) {
		const sp = new SvelteURLSearchParams();
		if (filters.name) sp.set('name', filters.name);
		if (filters.artist) sp.set('artist', filters.artist);
		if (filters.id) sp.set('id', filters.id);
		const qs = sp.toString();
		goto(qs ? `${resolve('/admin/music', {})}?${qs}` : resolve('/admin/music', {}));
	}

	function handlePageChange(p: number, ps: number) {
		const sp = new SvelteURLSearchParams(page.url.searchParams);
		sp.set('page', String(p));
		if (ps !== data.pageSize) sp.set('pageSize', String(ps));
		goto(`${resolve('/admin/music', {})}?${sp.toString()}`);
	}

	function handlePlay(item: Music) {
		if ($playerState.currentTrack?.id === item.id) {
			playerState.set({ currentTrack: null, playing: false, currentTime: 0, duration: 0 });
		} else {
			playerState.update((s) => ({ ...s, currentTrack: item }));
		}
	}

	function handleUploaded() {
		invalidateAll();
	}

	function handleSaved(updated: Music) {
		adminState.selectedMusic = updated;
		if ($playerState.currentTrack?.id === updated.id) {
			playerState.update((s) => ({ ...s, currentTrack: updated }));
		}
		invalidateAll();
	}

	function handleDeleted() {
		const deletedId = adminState.selectedMusic?.id;
		adminState.selectedMusic = null;
		if (deletedId && $playerState.currentTrack?.id === deletedId) {
			playerState.set({ currentTrack: null, playing: false, currentTime: 0, duration: 0 });
		}
		invalidateAll();
	}
</script>

<svelte:head>
	<title>音乐管理 - SALT X</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1">
		<div class="flex min-w-0 flex-1 flex-col p-6">
			<SearchBar filters={data.filters} onsearch={handleSearch} onupload={() => (uploadOpen = true)} />
			<MusicTable
				items={data.items}
				selectedId={adminState.selectedMusic?.id ?? null}
				playingId={$playerState.currentTrack?.id ?? null}
				onselect={(item) => (adminState.selectedMusic = item)}
				onplay={handlePlay}
			/>
			<Pagination
				page={data.page}
				pageSize={data.pageSize}
				total={data.total}
				totalPages={data.totalPages}
				onchange={handlePageChange}
			/>
		</div>
		<MusicDetail music={adminState.selectedMusic} onsaved={handleSaved} ondeleted={handleDeleted} />
	</div>
</div>

<UploadModal bind:open={uploadOpen} onuploaded={handleUploaded} />
