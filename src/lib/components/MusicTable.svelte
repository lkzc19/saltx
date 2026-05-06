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

<div class="flex-1 overflow-auto rounded-lg border border-border">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-bg-card text-left text-xs text-text-muted">
				<th class="w-12 px-4 py-3 font-medium"></th>
				<th class="px-4 py-3 font-medium">ID</th>
				<th class="px-4 py-3 font-medium">名称</th>
				<th class="px-4 py-3 font-medium">艺术家</th>
				<th class="px-4 py-3 font-medium">版本</th>
				<th class="px-4 py-3 font-medium">格式</th>
				<th class="px-4 py-3 font-medium">创建时间</th>
			</tr>
		</thead>
		<tbody>
			{#each items as item (item.id)}
				<tr
					class="cursor-pointer border-b border-border transition-colors hover:bg-[var(--highlight-bg)]"
					style={selectedId === item.id ? 'background: var(--highlight-bg); border-left: 2px solid var(--highlight-border)' : ''}
					onclick={() => onselect(item)}
				>
					<td class="px-4 py-3">
						<button
							onclick={(e) => { e.stopPropagation(); onplay(item); }}
							class="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:text-primary"
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
					<td class="px-4 py-3 font-mono text-xs text-text-muted">{item.id}</td>
					<td class="px-4 py-3 text-text">{item.name}</td>
					<td class="px-4 py-3 text-text-muted">{item.artist}</td>
					<td class="px-4 py-3">
						<span class="rounded bg-bg-card px-2 py-0.5 text-xs text-text-muted">{item.version}</span>
					</td>
					<td class="px-4 py-3">
						<span class="font-mono text-xs uppercase text-text-muted">{item.extension}</span>
					</td>
					<td class="px-4 py-3 text-xs text-text-disabled">{formatDate(item.created_at)}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="px-4 py-12 text-center text-text-disabled">暂无数据</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
