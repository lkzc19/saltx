<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import MusicTable from './_components/MusicTable.svelte';
	import MusicDetail from './_components/MusicDetail.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Scrollbar from '$lib/components/Scrollbar.svelte';
	import { adminState, playerState, loadTracks } from '$lib/stores/admin.svelte';
	import type { Music } from '$lib/types/music';

	let { data } = $props();

	function handlePageChange(p: number, ps: number) {
		const sp = new SvelteURLSearchParams(page.url.searchParams);
		sp.set('page', String(p));
		if (ps !== data.pageSize) sp.set('pageSize', String(ps));
		goto(`${resolve('/admin/music', {})}?${sp.toString()}`);
	}

	function handlePlay(item: Music) {
		if ($playerState.currentTrack?.id === item.id) {
			playerState.update((s) => ({ ...s, currentTrack: null, currentIndex: -1, playing: false, currentTime: 0, duration: 0 }));
		} else {
			const index = $playerState.tracks.findIndex((t) => t.id === item.id);
			playerState.update((s) => ({ ...s, currentTrack: item, currentIndex: index >= 0 ? index : s.currentIndex }));
		}
	}

	function handleCreated(created: Music) {
		loadTracks([...$playerState.tracks, created]);
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
			playerState.update((s) => ({ ...s, currentTrack: null, currentIndex: -1, playing: false, currentTime: 0, duration: 0 }));
		}
		invalidateAll();
	}
</script>

<svelte:head>
	<title>音乐管理 - SALT X</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1">
		<div class="flex min-w-0 flex-1 flex-col">
			<Scrollbar class="min-h-0 flex-1"><div class="p-4">
				<MusicTable
					items={data.items}
					selectedId={adminState.selectedMusic?.id ?? null}
					playingId={$playerState.currentTrack?.id ?? null}
					onselect={(item) => (adminState.selectedMusic = item)}
					onplay={handlePlay}
					onadd={() => (adminState.addingMusic = true)}
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
		<MusicDetail music={adminState.selectedMusic} onsaved={handleSaved} oncreated={handleCreated} ondeleted={handleDeleted} />
	</div>
</div>
