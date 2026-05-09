<script lang="ts">
	import type { Music } from '$lib/types/music';

	let {
		open = $bindable(false),
		albumId,
		existingIds = [],
		onadded
	}: {
		open: boolean;
		albumId: string;
		existingIds: string[];
		onadded: () => void;
	} = $props();

	let musicList = $state<Music[]>([]);
	let loading = $state(false);
	let saving = $state(false);
	let searchName = $state('');
	let searchArtist = $state('');
	let selected = $state<Set<string>>(new Set());

	async function fetchMusic() {
		loading = true;
		try {
			const params = new URLSearchParams({ pageSize: '50' });
			if (searchName) params.set('name', searchName);
			if (searchArtist) params.set('artist', searchArtist);
			const res = await fetch(`/api/admin/music/list?${params.toString()}`);
			if (res.ok) {
				const data = (await res.json()) as { items: Music[] };
				musicList = data.items;
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open) {
			searchName = '';
			searchArtist = '';
			selected = new Set();
			fetchMusic();
		}
	});

	function toggleSelect(id: string) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	async function handleAdd() {
		if (selected.size === 0 || saving) return;
		saving = true;
		try {
			await fetch(`/api/admin/album/${albumId}/music`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ music_ids: [...selected] })
			});
			onadded();
			open = false;
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onclick={() => (open = false)}
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex h-[70vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-bg-card shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 class="text-base font-semibold text-text">添加音乐</h2>
				<button
					onclick={() => (open = false)}
					class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text"
					aria-label="关闭"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Search -->
			<div class="flex gap-2 border-b border-border px-5 py-3">
				<input
					type="text"
					bind:value={searchName}
					placeholder="名称"
					onkeydown={(e) => e.key === 'Enter' && fetchMusic()}
					class="h-8 flex-1 rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
				/>
				<input
					type="text"
					bind:value={searchArtist}
					placeholder="艺术家"
					onkeydown={(e) => e.key === 'Enter' && fetchMusic()}
					class="h-8 w-32 rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
				/>
				<button
					onclick={fetchMusic}
					class="h-8 rounded-md border border-border px-3 text-sm text-text-muted transition-colors hover:bg-border hover:text-text"
				>
					搜索
				</button>
			</div>

			<!-- List -->
			<div class="flex-1 overflow-auto">
				{#if loading}
					<div class="flex h-32 items-center justify-center text-text-disabled">加载中...</div>
				{:else if musicList.length === 0}
					<div class="flex h-32 items-center justify-center text-text-disabled">暂无音乐</div>
				{:else}
					<ul class="divide-y divide-border">
						{#each musicList as item (item.id)}
							{@const isExisting = existingIds.includes(item.id)}
							{@const isSelected = selected.has(item.id)}
							<li>
								<button
									type="button"
									onclick={() => !isExisting && toggleSelect(item.id)}
									disabled={isExisting}
									class="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors"
									class:opacity-40={isExisting}
									class:cursor-not-allowed={isExisting}
									class:hover:bg-border={!isExisting}
									class:bg-highlight-bg={isSelected}
								>
									<!-- 封面 -->
									<div class="h-9 w-9 shrink-0 overflow-hidden rounded border border-border bg-bg-primary">
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
									<!-- 信息 -->
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm text-text">{item.name}</p>
										<p class="truncate text-xs text-text-muted">{item.artist}</p>
									</div>
									<!-- 状态 -->
									{#if isExisting}
										<span class="text-xs text-text-disabled">已添加</span>
									{:else if isSelected}
										<svg class="h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 24 24">
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-border px-5 py-3">
				<span class="text-xs text-text-muted">已选 {selected.size} 首</span>
				<div class="flex gap-2">
					<button
						onclick={() => (open = false)}
						class="h-8 rounded-md border border-border px-4 text-sm text-text-muted transition-colors hover:bg-border hover:text-text"
					>
						取消
					</button>
					<button
						onclick={handleAdd}
						disabled={selected.size === 0 || saving}
						class="flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{#if saving}
							<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
						{/if}
						添加到专辑
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
