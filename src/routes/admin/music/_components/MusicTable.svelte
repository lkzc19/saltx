<script lang="ts">
	import type { Music } from '$lib/types/music';
	import DataTable from '$lib/components/DataTable.svelte';
	import { Play, Pause } from '@lucide/svelte';

	let {
		items,
		selectedId,
		playingId,
		onselect,
		onplay
	}: {
		items: Music[];
		selectedId: string | null;
		playingId: string | null;
		onselect: (item: Music) => void;
		onplay: (item: Music) => void;
	} = $props();

	const columns = [
		{ header: '', width: '2.5rem' },
		{ header: '名称' },
		{ header: '艺术家' },
		{ header: '', width: '3rem' }
	];
</script>

<DataTable
	{columns}
	data={items}
	key={(item) => item.id}
>
	{#snippet row(item)}
		<td class="border-b border-r border-border-primary px-2 align-middle" onclick={() => onselect(item)}>
			<div class="h-8 w-8 overflow-hidden rounded border border-border-primary bg-fg">
				{#if item.cover_file_key}
					<img src={`/files/${item.cover_file_key}`} alt="" class="h-full w-full object-cover" />
				{:else}
					<div class="flex h-full w-full items-center justify-center text-text-disabled">
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
						</svg>
					</div>
				{/if}
			</div>
		</td>
		<td class="cursor-pointer border-b border-r border-border-primary px-4 align-middle text-text-primary" onclick={() => onselect(item)}>
			{item.name}
		</td>
		<td class="cursor-pointer border-b border-r border-border-primary px-4 align-middle text-text-primary" onclick={() => onselect(item)}>
			{item.artist}
		</td>
		<td class="border-b border-r border-border-primary">
			<div class="flex h-12 w-12 items-center justify-center">
			<button
				onclick={(e) => {
					e.stopPropagation();
					onplay(item);
				}}
				class="flex h-7 w-7 items-center justify-center rounded-full text-text-primary transition-colors hover:text-primary"
				class:text-primary={playingId === item.id}
				aria-label="播放 {item.name}"
			>
				{#if playingId === item.id}
					<Pause class="h-4 w-4" fill="currentColor" />
				{:else}
					<Play class="h-4 w-4" fill="currentColor" />
				{/if}
			</button>
			</div>
		</td>
	{/snippet}
</DataTable>

