<script lang="ts">
	import type { Image } from '$lib/types/music';
	import { getThumbnailUrl } from '$lib/utils/music';

	let {
		items,
		onselect
	}: {
		items: Image[];
		onselect: (item: Image) => void;
	} = $props();
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
					<img
							src={getThumbnailUrl(item.file_key!)}
							alt={item.name}
							class="h-full w-full object-cover"
						/>
					<div class="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
						<p class="truncate text-xs text-white">{item.name}</p>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>