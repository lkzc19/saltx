<script lang="ts">
	import type { Album } from '$lib/types/music';

	let {
		items,
		selectedId,
		onselect
	}: {
		items: Album[];
		selectedId: string | null;
		onselect: (item: Album) => void;
	} = $props();
</script>

<div class="flex-1 overflow-auto rounded-lg border border-border p-4">
	{#if items.length === 0}
		<div class="flex h-32 items-center justify-center text-text-disabled">暂无专辑</div>
	{:else}
		<div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
			{#each items as item (item.id)}
				<button
					type="button"
					onclick={() => onselect(item)}
					class="group flex flex-col overflow-hidden rounded-lg border transition-all"
					class:border-primary={selectedId === item.id}
					class:border-border={selectedId !== item.id}
					class:bg-bg-card={selectedId === item.id}
				>
					<!-- 封面 -->
					<div class="relative aspect-square w-full overflow-hidden bg-bg-primary">
						{#if item.cover_file_key}
							<img
								src={`/files/${item.cover_file_key}`}
								alt={item.name}
								class="h-full w-full object-cover transition-transform group-hover:scale-105"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center text-text-disabled">
								<svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
								</svg>
							</div>
						{/if}
					</div>
					<!-- 信息 -->
					<div class="p-2.5">
						<p class="truncate text-sm font-medium text-text">{item.name}</p>
						{#if item.artist}
							<p class="truncate text-xs text-text-muted">{item.artist}</p>
						{/if}
						<p class="mt-1 text-xs text-text-disabled">{item.music_count ?? 0} 首</p>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
