<script lang="ts">
	import type { Image } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';

	let {
		items,
		onselect
	}: {
		items: Image[];
		onselect: (item: Image) => void;
	} = $props();

	function getThumbnailUrl(item: Image): string {
		const key = `image/${item.id}_thumb.webp`;
		return getR2Url(key);
	}
</script>

<div class="flex-1 overflow-auto rounded-lg border border-border p-4">
	{#if items.length === 0}
		<div class="flex h-32 items-center justify-center text-text-disabled">暂无图片</div>
	{:else}
		<div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
			{#each items as item (item.id)}
				<button
					type="button"
					class="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border transition-all hover:border-primary"
					onclick={() => onselect(item)}
				>
					{#if item.thumbnail_key}
						<img
							src={getThumbnailUrl(item)}
							alt={item.name}
							class="h-full w-full object-cover"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-bg-card text-text-disabled">
							<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
					{/if}
					<div class="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
						<p class="truncate text-xs text-white">{item.name}</p>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>