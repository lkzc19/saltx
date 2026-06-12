<script lang="ts">
	import type { Music, Image } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';
	import { formatDate } from '$lib/utils/date';
	import { adminState } from '$lib/stores/admin.svelte';
	import ImagePickerModal from './ImagePickerModal.svelte';
	import Scrollbar from '$lib/components/Scrollbar.svelte';

	let {
		music,
		onsaved,
		oncreated,
		ondeleted
	}: {
		music: Music | null;
		onsaved: (updated: Music) => void;
		oncreated: (created: Music) => void;
		ondeleted: () => void;
	} = $props();

	let editing = $state(false);
	let saving = $state(false);
	let error = $state('');
	let pickerOpen = $state(false);

	// 表单字段
	let editName = $state('');
	let editArtist = $state('');
	let editCoverFileKey = $state<string | null>(null);
	let newFile = $state<File | null>(null);
	let fileInputEl = $state<HTMLInputElement | undefined>(undefined);

	let fileKey = $derived(music ? music.file_key : '');
	let fileUrl = $derived(music ? getR2Url(music.file_key) : '');
	let isAdding = $derived(adminState.addingMusic);

	// 进入新增模式时自动初始化表单
	$effect(() => {
		if (isAdding) {
			editName = '';
			editArtist = '';
			editCoverFileKey = null;
			newFile = null;
			error = '';
			editing = true;
		}
	});

	function startEdit() {
		if (!music) return;
		editName = music.name;
		editArtist = music.artist;
		editCoverFileKey = music.cover_file_key;
		newFile = null;
		error = '';
		editing = true;
	}

	function close() {
		adminState.addingMusic = false;
		adminState.selectedMusic = null;
		editing = false;
		newFile = null;
		error = '';
		if (fileInputEl) fileInputEl.value = '';
	}

	function cancelEdit() {
		if (isAdding) {
			close();
			return;
		}
		editing = false;
		newFile = null;
		error = '';
		if (fileInputEl) fileInputEl.value = '';
	}

	function handleCoverSelect(img: Image) {
		editCoverFileKey = img.file_key;
	}

	function clearCover() {
		editCoverFileKey = null;
	}

	async function handleSave() {
		if (saving) return;
		saving = true;
		error = '';

		try {
			const formData = new FormData();
			formData.set('name', editName);
			formData.set('artist', editArtist);
			formData.set('cover_file_key', editCoverFileKey ?? '');

			if (isAdding) {
				// 新增模式：必须有音频文件
				if (!newFile) {
					error = '请选择音频文件';
					saving = false;
					return;
				}
				formData.set('file', newFile);
				const res = await fetch('/api/admin/music', { method: 'POST', body: formData });
				if (!res.ok) {
					const body = (await res.json()) as { error?: string };
					throw new Error(body.error ?? '创建失败');
				}
				const created = (await res.json()) as Music;
				oncreated(created);
			} else {
				// 编辑模式
				if (!music) return;
				if (newFile) {
					formData.set('file', newFile);
				}
				const res = await fetch(`/api/admin/music?id=${music.id}`, { method: 'PUT', body: formData });
				if (!res.ok) {
					const body = (await res.json()) as { error?: string };
					throw new Error(body.error ?? '保存失败');
				}
				const updated = (await res.json()) as Music;
				onsaved(updated);
			}

			editing = false;
			newFile = null;
			if (isAdding) adminState.addingMusic = false;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!music || !confirm(`确定要删除「${music.name}」吗？`)) return;

		const res = await fetch(`/api/admin/music?id=${music.id}`, { method: 'DELETE' });
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			error = body.error ?? '删除失败';
			return;
		}
		ondeleted();
	}
</script>

{#if music || isAdding}
	<aside class="flex w-80 shrink-0 flex-col overflow-hidden border-l border-border-primary bg-fg">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border-primary px-4 py-4">
			<h3 class="text-sm font-semibold text-text-primary">{isAdding ? '新增音乐' : '音乐详情'}</h3>
			<div class="flex items-center gap-1">
				<button
					onclick={close}
					class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text-primary"
					aria-label="关闭"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<!-- 内容区 -->
		<div class="min-h-0 flex flex-1 flex-col">
			<Scrollbar class="min-h-0 flex-1">
				<div class="p-4">
				{#if editing || isAdding}
					<!-- 编辑/新增模式 -->
					<div class="space-y-4">
						<!-- 封面 -->
						<div>
							<span class="text-xs text-text-disabled">封面</span>
							<div
								class="group relative mt-2 w-full cursor-pointer overflow-hidden rounded-md border border-border-primary bg-bg-secondary"
								style="aspect-ratio: 1/1"
							>
								{#if editCoverFileKey}
									<img
										src={getR2Url(editCoverFileKey)}
										alt="封面"
										class="h-full w-full object-cover"
									/>
									<div class="absolute inset-0 flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
										<button
											type="button"
											onclick={() => (pickerOpen = true)}
											class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60"
										>
											替换封面
										</button>
										<button
											type="button"
											onclick={clearCover}
											class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60"
										>
											移除封面
										</button>
									</div>
								{:else}
									<button
										type="button"
										onclick={() => (pickerOpen = true)}
										class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-text-disabled"
									>
										<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
										</svg>
										<span class="text-xs">点击上传封面</span>
									</button>
								{/if}
							</div>
						</div>

						<!-- 名称 -->
						<div>
							<label for="detail-name" class="mb-1.5 block text-xs text-text-disabled">名称</label>
							<input
								id="detail-name"
								type="text"
								bind:value={editName}
								class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
							/>
						</div>

						<!-- 艺术家 -->
						<div>
							<label for="detail-artist" class="mb-1.5 block text-xs text-text-disabled">艺术家</label>
							<input
								id="detail-artist"
								type="text"
								bind:value={editArtist}
								class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
							/>
						</div>

						<!-- 音频文件 -->
						<div>
							<label for="detail-file" class="mb-1.5 block text-xs text-text-disabled">{isAdding ? '音频文件' : '替换音乐源（可选）'}</label>
							<label class="flex h-9 cursor-pointer items-center rounded-md border border-border-primary bg-bg-secondary px-3 text-sm transition-colors">
								<span class={newFile ? 'text-text-primary' : 'text-text-disabled'}>
									{newFile ? newFile.name : '选择音频文件'}
								</span>
								<input
									id="detail-file"
									bind:this={fileInputEl}
									type="file"
									accept="audio/*"
									class="hidden"
									onchange={(e) => {
										newFile = (e.target as HTMLInputElement).files?.[0] ?? null;
									}}
								/>
							</label>
						</div>

						{#if error}
							<p class="text-xs text-error">{error}</p>
						{/if}
					</div>
				{:else if music}
					<!-- 查看模式 -->
					<div class="space-y-4">
						{#if music.cover_file_key}
							<div class="w-full overflow-hidden rounded-md border border-border-primary" style="aspect-ratio: 1/1">
								<img
									src={getR2Url(music.cover_file_key)}
									alt="封面"
									class="h-full w-full object-cover"
								/>
							</div>
						{/if}

						<div>
							<span class="text-xs text-text-disabled">ID</span>
							<p class="mt-1 font-mono text-sm text-text-primary">{music.id}</p>
						</div>
						<div>
							<span class="text-xs text-text-disabled">名称</span>
							<p class="mt-1 text-sm text-text-primary">{music.name}</p>
						</div>
						<div>
							<span class="text-xs text-text-disabled">艺术家</span>
							<p class="mt-1 text-sm text-text-primary">{music.artist}</p>
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
				{/if}
			</div>
			</Scrollbar>

			<!-- 按钮区 -->
			<div class="flex min-h-18 items-center border-t border-border-primary px-4">
				{#if editing || isAdding}
					<div class="flex w-full gap-2">
						<button
							type="button"
							onclick={cancelEdit}
							class="h-8 flex-1 rounded-md border border-border-primary text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary"
						>
							取消
						</button>
						<button
							type="button"
							onclick={handleSave}
							disabled={saving}
							class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-cf text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							{#if saving}
								<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
							{/if}
							{isAdding ? '创建' : '保存'}
						</button>
					</div>
				{:else if music}
					<div class="flex w-full gap-2">
						<button
							type="button"
							onclick={startEdit}
							class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-primary text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary"
						>
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
							</svg>
							编辑
						</button>
						<button
							type="button"
							onclick={handleDelete}
							class="flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-error text-sm text-error transition-colors hover:bg-error hover:text-white"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							删除
						</button>
					</div>
				{/if}
			</div>
		</div>
	</aside>
{/if}

<ImagePickerModal bind:open={pickerOpen} onselect={handleCoverSelect} />
