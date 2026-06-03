<script lang="ts">
	import type { Music } from '$lib/types/music';
	import { formatDate } from '$lib/utils/date';

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
</script>

<div class="flex-1 overflow-auto rounded-lg border border-border-primary">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border-primary bg-fg text-left text-xs text-text-primary">
				<th class="w-12 px-4 py-3 font-medium"></th>
				<th class="w-10 px-2 py-3 font-medium"></th>
				<th class="px-4 py-3 font-medium">ID</th>
				<th class="px-4 py-3 font-medium">名称</th>
				<th class="px-4 py-3 font-medium">艺术家</th>
				<th class="px-4 py-3 font-medium">创建时间</th>
			</tr>
		</thead>
		<tbody>
			{#each items as item (item.id)}
				<tr
					class="cursor-pointer border-b border-border-primary transition-colors hover:bg-bg-primary-hover"
					style={selectedId === item.id
						? 'background: var(--color-bg-primary-hover); border-left: 2px solid var(--color-border-primary)'
						: ''}
					tabindex="0"
					onclick={() => onselect(item)}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onselect(item)}
				>
					<td class="px-4 py-3">
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
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
								</svg>
							{:else}
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M8 5v14l11-7z" />
								</svg>
							{/if}
						</button>
					</td>
					<td class="px-2 py-3">
						<div class="h-8 w-8 overflow-hidden rounded border border-border-primary bg-fg">
							{#if item.cover_file_key}
								<img
									src={`/files/${item.cover_file_key}`}
									alt=""
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center text-text-disabled">
									<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
									</svg>
								</div>
							{/if}
						</div>
					</td>
					<td class="px-4 py-3 font-mono text-xs text-text-primary">{item.id}</td>
					<td class="px-4 py-3 text-text-primary">{item.name}</td>
					<td class="px-4 py-3 text-text-primary">{item.artist}</td>
					<td class="px-4 py-3 text-xs text-text-disabled">{formatDate(item.created_at)}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6" class="px-4 py-12 text-center text-text-disabled">暂无数据</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
