<script lang="ts">
	import type { Music } from '$lib/types/music';
	import { buildMusicFileKey } from '$lib/utils/music';
	import { formatDate } from '$lib/utils/date';
	import { adminState } from '$lib/stores/admin.svelte';

	let { music }: { music: Music | null } = $props();

	let fileKey = $derived(music ? buildMusicFileKey(music.id, music.version, music.extension) : '');
</script>

{#if music}
	<aside class="w-80 shrink-0 border-l border-border bg-bg-card p-5">
		<div class="mb-5 flex items-center justify-between">
			<h3 class="text-sm font-semibold text-text">音乐详情</h3>
			<button
				onclick={() => (adminState.selectedMusic = null)}
				class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="space-y-4">
			<div>
				<span class="text-xs text-text-disabled">ID</span>
				<p class="mt-1 font-mono text-sm text-text">{music.id}</p>
			</div>
			<div>
				<span class="text-xs text-text-disabled">名称</span>
				<p class="mt-1 text-sm text-text">{music.name}</p>
			</div>
			<div>
				<span class="text-xs text-text-disabled">艺术家</span>
				<p class="mt-1 text-sm text-text">{music.artist}</p>
			</div>
			<div>
				<span class="text-xs text-text-disabled">版本</span>
				<p class="mt-1">
					<span class="rounded bg-bg-primary px-2 py-0.5 text-xs text-text-muted">{music.version}</span>
				</p>
			</div>
			<div>
				<span class="text-xs text-text-disabled">格式</span>
				<p class="mt-1 font-mono text-sm uppercase text-text-muted">{music.extension}</p>
			</div>
			<div>
				<span class="text-xs text-text-disabled">文件路径</span>
				<p class="mt-1 break-all font-mono text-xs text-primary">{fileKey}</p>
			</div>
			<div>
				<span class="text-xs text-text-disabled">创建时间</span>
				<p class="mt-1 text-xs text-text-disabled">{formatDate(music.created_at)}</p>
			</div>
			<div>
				<span class="text-xs text-text-disabled">更新时间</span>
				<p class="mt-1 text-xs text-text-disabled">{formatDate(music.updated_at)}</p>
			</div>
		</div>
	</aside>
{/if}
