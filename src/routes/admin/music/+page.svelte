<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import MusicTable from '$lib/components/MusicTable.svelte';
	import MusicDetail from '$lib/components/MusicDetail.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import UploadModal from '$lib/components/UploadModal.svelte';
	import { adminState, playerState } from '$lib/stores/admin.svelte';
	import type { Music } from '$lib/types/music';

	let { data } = $props();
	let uploadOpen = $state(false);

	function handleSearch(filters: { name: string; artist: string; id: string }) {
		const params = new URLSearchParams();
		if (filters.name) params.set('name', filters.name);
		if (filters.artist) params.set('artist', filters.artist);
		if (filters.id) params.set('id', filters.id);
		goto(`/admin/music?${params.toString()}`);
	}

	function handlePageChange(p: number, ps: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(p));
		if (ps !== data.pageSize) params.set('pageSize', String(ps));
		goto(`/admin/music?${params.toString()}`);
	}

	function handlePlay(item: Music) {
		if ($playerState.currentTrack?.id === item.id) {
			playerState.set({ currentTrack: null, playing: false, currentTime: 0, duration: 0 });
		} else {
			playerState.update((s) => ({ ...s, currentTrack: item }));
		}
	}

	function handleUploaded() {
		goto(page.url.href, { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>音乐管理 - SALT X</title>
</svelte:head>

<div class="flex h-full">
	<div class="flex min-w-0 flex-1 flex-col p-6">
		<SearchBar filters={data.filters} onsearch={handleSearch} onupload={() => (uploadOpen = true)} />
		<MusicTable items={data.items} selectedId={adminState.selectedMusic?.id ?? null} playingId={$playerState.currentTrack?.id ?? null} onselect={(item) => (adminState.selectedMusic = item)} onplay={handlePlay} />
		<Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onchange={handlePageChange} />
	</div>
	<MusicDetail music={adminState.selectedMusic} />
</div>

<UploadModal bind:open={uploadOpen} onuploaded={handleUploaded} />
