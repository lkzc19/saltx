<script lang="ts">
	import type { Album, Image, Music } from '$lib/types/music';
	import { formatDate } from '$lib/utils/date';
	import { adminState } from '$lib/stores/admin.svelte';
	import ImagePickerModal from './ImagePickerModal.svelte';
	import AlbumMusicPickerModal from './AlbumMusicPickerModal.svelte';

	let {
		album,
		onsaved,
		ondeleted,
		onmusic_updated
	}: {
		album: Album | null;
		onsaved: (updated: Album) => void;
		ondeleted: () => void;
		onmusic_updated: () => void;
	} = $props();

	let editing = $state(false);
	let saving = $state(false);
	let error = $state('');
	let pickerOpen = $state(false);
	let musicPickerOpen = $state(false);

	let editName = $state('');
	let editArtist = $state('');
	let editDescription = $state('');
	let editCoverFileKey = $state<string | null>(null);

	let albumTracks = $state<(Music & { sort_order: number })[]>([]);
	let loadingTracks = $state(false);

	async function fetchTracks() {
		if (!album) return;
		loadingTracks = true;
		try {
			const res = await fetch(`/api/admin/album/${album.id}/music`);
			if (res.ok) {
				const data = (await res.json()) as { items: (Music & { sort_order: number })[] };
				albumTracks = data.items;
			}
		} finally {
			loadingTracks = false;
		}
	}

	$effect(() => {
		if (album) {
			editing = false;
			error = '';
			fetchTracks();
		} else {
			albumTracks = [];
		}
	});

	function startEdit() {
		if (!album) return;
		editName = album.name;
		editArtist = album.artist ?? '';
		editDescription = album.description ?? '';
		editCoverFileKey = album.cover_file_key;
		error = '';
		editing = true;
	}

	function cancelEdit() {
		editing = false;
		error = '';
	}

	function handleCoverSelect(img: Image) {
		editCoverFileKey = img.file_key;
	}

	async function handleSave() {
		if (!album || saving) return;
		saving = true;
		error = '';
		try {
			const res = await fetch(`/api/admin/album?id=${album.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editName,
					artist: editArtist || null,
					description: editDescription || null,
					cover_file_key: editCoverFileKey
				})
			});
			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body.error ?? '保存失败');
			}
			const updated = (await res.json()) as Album;
			onsaved(updated);
			editing = false;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!album || !confirm(`确定要删除专辑「${album.name}」吗？`)) return;
		const res = await fetch(`/api/admin/album?id=${album.id}`, { method: 'DELETE' });
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			error = body.error ?? '删除失败';
			return;
		}
		ondeleted();
	}

	async function handleRemoveTrack(musicId: string) {
		if (!album) return;
		await fetch(`/api/admin/album/${album.id}/music?music_id=${musicId}`, { method: 'DELETE' });
		albumTracks = albumTracks.filter((t) => t.id !== musicId);
		onmusic_updated();
	}

	function handleTracksAdded() {
		fetchTracks();
		onmusic_updated();
	}
</script>

{#if album}
	<aside class="flex w-80 shrink-0 flex-col border-l border-border bg-bg-card">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-5 py-4">
			<h3 class="text-sm font-semibold text-text">专辑详情</h3>
			<div class="flex items-center gap-1">
				{#if !editing}
					<button
						onclick={startEdit}
						class="flex h-7 items-center gap-1 rounded px-2 text-xs text-text-muted transition-colors hover:bg-border hover:text-text"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
						编辑
					</button>
				{/if}
				<button
					onclick={() => (adminState.selectedAlbum = null)}
					class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text"
					aria-label="关闭"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<div class="flex-1 overflow-auto p-5">
			{#if editing}
				<!-- 编辑模式 -->
				<div class="space-y-4">
					<!-- 封面 -->
					<div>
						<p class="text-xs text-text-disabled">封面</p>
						<div class="mt-2 flex items-center gap-3">
							<div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-bg-primary">
								{#if editCoverFileKey}
									<img src={`/files/${editCoverFileKey}`} alt="封面" class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full w-full items-center justify-center text-text-disabled">
										<svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
										</svg>
									</div>
								{/if}
							</div>
							<div class="flex flex-col gap-1.5">
								<button
									type="button"
									onclick={() => (pickerOpen = true)}
									class="h-7 rounded border border-border px-2.5 text-xs text-text-muted transition-colors hover:bg-border hover:text-text"
								>
									{editCoverFileKey ? '更换封面' : '选择封面'}
								</button>
								{#if editCoverFileKey}
									<button
										type="button"
										onclick={() => (editCoverFileKey = null)}
										class="h-7 rounded border border-border px-2.5 text-xs text-text-disabled transition-colors hover:text-error"
									>
										移除封面
									</button>
								{/if}
							</div>
						</div>
					</div>

					<!-- 名称 -->
					<div>
						<label for="detail-album-name" class="mb-1.5 block text-xs text-text-disabled">名称</label>
						<input
							id="detail-album-name"
							type="text"
							bind:value={editName}
							class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text outline-none transition-colors focus:border-primary"
						/>
					</div>

					<!-- 艺术家 -->
					<div>
						<label for="detail-album-artist" class="mb-1.5 block text-xs text-text-disabled">艺术家/乐队</label>
						<input
							id="detail-album-artist"
							type="text"
							bind:value={editArtist}
							placeholder="可选"
							class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
						/>
					</div>

					<!-- 简介 -->
					<div>
						<label for="detail-album-desc" class="mb-1.5 block text-xs text-text-disabled">简介</label>
						<textarea
							id="detail-album-desc"
							bind:value={editDescription}
							rows="3"
							placeholder="可选"
							class="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary resize-none"
						></textarea>
					</div>

					{#if error}
						<p class="text-xs text-error">{error}</p>
					{/if}

					<div class="flex gap-2 pt-1">
						<button
							type="button"
							onclick={cancelEdit}
							class="h-8 flex-1 rounded-md border border-border text-sm text-text-muted transition-colors hover:bg-border hover:text-text"
						>
							取消
						</button>
						<button
							type="button"
							onclick={handleSave}
							disabled={saving}
							class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							{#if saving}
								<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
							{/if}
							保存
						</button>
					</div>

					<div class="border-t border-border pt-3">
						<button
							type="button"
							onclick={handleDelete}
							class="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-error text-sm text-error transition-colors hover:bg-error hover:text-white"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							删除专辑
						</button>
					</div>
				</div>
			{:else}
				<!-- 查看模式 -->
				<div class="space-y-4">
					{#if album.cover_file_key}
						<div class="mx-auto h-32 w-32 overflow-hidden rounded-lg border border-border">
							<img src={`/files/${album.cover_file_key}`} alt="封面" class="h-full w-full object-cover" />
						</div>
					{/if}

					<div>
						<span class="text-xs text-text-disabled">ID</span>
						<p class="mt-1 font-mono text-sm text-text">{album.id}</p>
					</div>
					<div>
						<span class="text-xs text-text-disabled">名称</span>
						<p class="mt-1 text-sm text-text">{album.name}</p>
					</div>
					{#if album.artist}
						<div>
							<span class="text-xs text-text-disabled">艺术家/乐队</span>
							<p class="mt-1 text-sm text-text">{album.artist}</p>
						</div>
					{/if}
					{#if album.description}
						<div>
							<span class="text-xs text-text-disabled">简介</span>
							<p class="mt-1 text-sm text-text-muted leading-relaxed">{album.description}</p>
						</div>
					{/if}
					<div>
						<span class="text-xs text-text-disabled">创建时间</span>
						<p class="mt-1 text-xs text-text-disabled">{formatDate(album.created_at)}</p>
					</div>
					<div>
						<span class="text-xs text-text-disabled">更新时间</span>
						<p class="mt-1 text-xs text-text-disabled">{formatDate(album.updated_at)}</p>
					</div>

					<!-- 曲目列表 -->
					<div class="border-t border-border pt-4">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium text-text-muted">曲目列表</span>
							<button
								type="button"
								onclick={() => (musicPickerOpen = true)}
								class="flex h-6 items-center gap-1 rounded px-2 text-xs text-text-muted transition-colors hover:bg-border hover:text-primary"
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								添加
							</button>
						</div>

						{#if loadingTracks}
							<div class="py-4 text-center text-xs text-text-disabled">加载中...</div>
						{:else if albumTracks.length === 0}
							<div class="py-4 text-center text-xs text-text-disabled">暂无曲目</div>
						{:else}
							<ul class="space-y-1">
								{#each albumTracks as track, i (track.id)}
									<li class="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-border">
										<span class="w-5 shrink-0 text-center text-xs text-text-disabled">{i + 1}</span>
										<div class="h-7 w-7 shrink-0 overflow-hidden rounded border border-border bg-bg-primary">
											{#if track.cover_file_key}
												<img src={`/files/${track.cover_file_key}`} alt="" class="h-full w-full object-cover" />
											{:else}
												<div class="flex h-full w-full items-center justify-center text-text-disabled">
													<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
														<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
													</svg>
												</div>
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<p class="truncate text-xs text-text">{track.name}</p>
											<p class="truncate text-xs text-text-disabled">{track.artist}</p>
										</div>
										<button
											type="button"
											onclick={() => handleRemoveTrack(track.id)}
											class="hidden h-5 w-5 items-center justify-center rounded text-text-disabled transition-colors hover:text-error group-hover:flex"
											aria-label="移除"
										>
											<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<div class="border-t border-border pt-3">
						<button
							type="button"
							onclick={handleDelete}
							class="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-error text-sm text-error transition-colors hover:bg-error hover:text-white"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							删除专辑
						</button>
					</div>
				</div>
			{/if}
		</div>
	</aside>
{/if}

<ImagePickerModal bind:open={pickerOpen} onselect={handleCoverSelect} />
<AlbumMusicPickerModal
	bind:open={musicPickerOpen}
	albumId={album?.id ?? ''}
	existingIds={albumTracks.map((t) => t.id)}
	onadded={handleTracksAdded}
/>
