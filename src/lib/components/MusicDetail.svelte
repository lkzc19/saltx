<script lang="ts">
	import type { Music, Image } from '$lib/types/music';
	import { buildMusicFileKey } from '$lib/utils/music';
	import { formatDate } from '$lib/utils/date';
	import { adminState } from '$lib/stores/admin.svelte';
	import ImagePickerModal from './ImagePickerModal.svelte';

	let {
		music,
		onsaved,
		ondeleted
	}: {
		music: Music | null;
		onsaved: (updated: Music) => void;
		ondeleted: () => void;
	} = $props();

	let editing = $state(false);
	let saving = $state(false);
	let error = $state('');
	let pickerOpen = $state(false);

	// 编辑表单字段
	let editName = $state('');
	let editArtist = $state('');
	let editCoverFileKey = $state<string | null>(null);
	let newFile = $state<File | null>(null);
	let newVersion = $state('');
	let fileInputEl = $state<HTMLInputElement | undefined>(undefined);

	let fileKey = $derived(music ? buildMusicFileKey(music.id, music.version, music.extension) : '');

	function startEdit() {
		if (!music) return;
		editName = music.name;
		editArtist = music.artist;
		editCoverFileKey = music.cover_file_key;
		newFile = null;
		newVersion = music.version;
		error = '';
		editing = true;
	}

	function cancelEdit() {
		editing = false;
		newFile = null;
		error = '';
		if (fileInputEl) fileInputEl.value = '';
	}

	function handleCoverSelect(img: Image) {
		editCoverFileKey = img.thumbnail_key ?? img.file_key ?? null;
	}

	function clearCover() {
		editCoverFileKey = null;
	}

	async function handleSave() {
		if (!music || saving) return;
		saving = true;
		error = '';

		try {
			const formData = new FormData();
			formData.set('name', editName);
			formData.set('artist', editArtist);
			formData.set('cover_file_key', editCoverFileKey ?? '');
			if (newFile) {
				formData.set('file', newFile);
				formData.set('version', newVersion);
			}

			const res = await fetch(`/api/music?id=${music.id}`, { method: 'PUT', body: formData });
			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body.error ?? '保存失败');
			}
			const updated = (await res.json()) as Music;
			onsaved(updated);
			editing = false;
			newFile = null;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!music || !confirm(`确定要删除「${music.name}」吗？`)) return;

		const res = await fetch(`/api/music?id=${music.id}`, { method: 'DELETE' });
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			error = body.error ?? '删除失败';
			return;
		}
		ondeleted();
	}
</script>

{#if music}
	<aside class="flex w-80 shrink-0 flex-col border-l border-border bg-bg-card">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-5 py-4">
			<h3 class="text-sm font-semibold text-text">音乐详情</h3>
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
					onclick={() => (adminState.selectedMusic = null)}
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
						<span class="text-xs text-text-disabled">封面</span>
						<div class="mt-2 flex items-center gap-3">
							<div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-bg-primary">
								{#if editCoverFileKey}
									<img
										src={`/files/${editCoverFileKey}`}
										alt="封面"
										class="h-full w-full object-cover"
									/>
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
										onclick={clearCover}
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
						<label class="mb-1.5 block text-xs text-text-disabled">名称</label>
						<input
							type="text"
							bind:value={editName}
							class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text outline-none transition-colors focus:border-primary"
						/>
					</div>

					<!-- 艺术家 -->
					<div>
						<label class="mb-1.5 block text-xs text-text-disabled">艺术家</label>
						<input
							type="text"
							bind:value={editArtist}
							class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text outline-none transition-colors focus:border-primary"
						/>
					</div>

					<!-- 替换音乐源 -->
					<div class="rounded-md border border-border p-3">
						<p class="mb-2 text-xs font-medium text-text-muted">替换音乐源（可选）</p>
						<div class="space-y-2">
							<div>
								<label class="mb-1 block text-xs text-text-disabled">版本</label>
								<input
									type="text"
									bind:value={newVersion}
									placeholder={music.version}
									disabled={!newFile}
									class="h-8 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text outline-none transition-colors focus:border-primary disabled:opacity-50"
								/>
							</div>
							<div>
								<label class="mb-1 block text-xs text-text-disabled">音频文件</label>
								<label class="flex h-8 cursor-pointer items-center rounded-md border border-border bg-bg-primary px-3 text-sm transition-colors hover:border-text-disabled">
									<span class={newFile ? 'text-text' : 'text-text-disabled'}>
										{newFile ? newFile.name : '选择音频文件'}
									</span>
									<input
										bind:this={fileInputEl}
										type="file"
										accept="audio/*"
										class="hidden"
										onchange={(e) => {
											newFile = (e.target as HTMLInputElement).files?.[0] ?? null;
											if (newFile && !newVersion) newVersion = music!.version;
										}}
									/>
								</label>
							</div>
						</div>
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
							删除音乐
						</button>
					</div>
				</div>
			{:else}
				<!-- 查看模式 -->
				<div class="space-y-4">
					<!-- 封面 -->
					{#if music.cover_file_key}
						<div class="mx-auto h-32 w-32 overflow-hidden rounded-lg border border-border">
							<img
								src={`/files/${music.cover_file_key}`}
								alt="封面"
								class="h-full w-full object-cover"
							/>
						</div>
					{/if}

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

					<div class="border-t border-border pt-3">
						<button
							type="button"
							onclick={handleDelete}
							class="flex h-8 w-full items-center justify-center gap-2 rounded-md border border-error text-sm text-error transition-colors hover:bg-error hover:text-white"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							删除音乐
						</button>
					</div>
				</div>
			{/if}
		</div>
	</aside>
{/if}

<ImagePickerModal bind:open={pickerOpen} onselect={handleCoverSelect} />
