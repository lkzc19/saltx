<script lang="ts">
	import type { Announcement } from '$lib/types/announcement';
	import type { Image } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';
	import { formatDate } from '$lib/utils/date';
	import { adminState } from '$lib/stores/admin.svelte';
	import Scrollbar from '$lib/components/Scrollbar.svelte';
	import ImagePickerModal from '$lib/components/ImagePickerModal.svelte';

	let {
		announcement,
		onsaved,
		oncreated,
		ondeleted
	}: {
		announcement: Announcement | null;
		onsaved: (updated: Announcement) => void;
		oncreated: (created: Announcement) => void;
		ondeleted: () => void;
	} = $props();

	let editing = $state(false);
	let saving = $state(false);
	let error = $state('');
	let pickerOpen = $state(false);

	let editTitle = $state('');
	let editContent = $state('');
	let editCoverFileKey = $state<string | null>(null);
	let editCategory = $state('general');
	let editIsRecommended = $state(false);

	let isAdding = $derived(adminState.addingAnnouncement);

	function handleCoverSelect(img: Image) {
		editCoverFileKey = img.file_key;
	}

	function clearCover() {
		editCoverFileKey = null;
		editCategory = 'general';
	}

	$effect(() => {
		if (isAdding) {
			editTitle = '';
			editContent = '';
			editCoverFileKey = null;
			editCategory = 'general';
			editIsRecommended = false;
			error = '';
			editing = true;
		}
	});

	function startEdit() {
		if (!announcement) return;
		editTitle = announcement.title;
		editContent = announcement.content ?? '';
		editCoverFileKey = announcement.cover_file_key;
		editCategory = announcement.category;
		editIsRecommended = announcement.is_recommended === 'true';
		error = '';
		editing = true;
	}

	function close() {
		adminState.addingAnnouncement = false;
		adminState.selectedAnnouncement = null;
		editing = false;
		error = '';
	}

	function cancelEdit() {
		if (isAdding) {
			close();
			return;
		}
		editing = false;
		error = '';
	}

	async function handleSave() {
		if (saving) return;
		saving = true;
		error = '';

		try {
			const formData = new FormData();
			formData.set('title', editTitle);
			formData.set('content', editContent);
			formData.set('cover_file_key', editCoverFileKey ?? '');
			formData.set('category', editCategory);
			formData.set('is_recommended', editIsRecommended ? 'true' : 'false');

			if (isAdding) {
				const res = await fetch('/api/admin/info', { method: 'POST', body: formData });
				if (!res.ok) {
					const body = (await res.json()) as { error?: string };
					throw new Error(body.error ?? '创建失败');
				}
				const created = (await res.json()) as Announcement;
				oncreated(created);
			} else {
				if (!announcement) return;
				const res = await fetch(`/api/admin/info?id=${announcement.id}`, { method: 'PUT', body: formData });
				if (!res.ok) {
					const body = (await res.json()) as { error?: string };
					throw new Error(body.error ?? '保存失败');
				}
				const updated = (await res.json()) as Announcement;
				onsaved(updated);
			}

			editing = false;
			if (isAdding) adminState.addingAnnouncement = false;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!announcement || !confirm(`确定要删除动向「${announcement.title}」吗？`)) return;

		const res = await fetch(`/api/admin/info?id=${announcement.id}`, { method: 'DELETE' });
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			error = body.error ?? '删除失败';
			return;
		}
		ondeleted();
	}
</script>

{#if announcement || isAdding}
	<aside class="flex w-80 shrink-0 flex-col overflow-hidden border-l border-border-primary bg-fg">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border-primary px-4 py-4">
			<h3 class="text-sm font-semibold text-text-primary">{isAdding ? '新增动向' : '动向详情'}</h3>
			<div class="flex items-center gap-1">
				<button
					onclick={close}
					class="flex size-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text-primary"
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
								style="aspect-ratio: 16/9"
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
										<span class="text-xs">点击选择封面</span>
									</button>
								{/if}
							</div>
						</div>

						<!-- 标题 -->
						<div>
							<label for="detail-title" class="mb-1.5 block text-xs text-text-disabled">标题</label>
							<input
								id="detail-title"
								type="text"
								bind:value={editTitle}
								class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
							/>
						</div>

						<!-- 分类 -->
						<div>
							<label for="detail-category" class="mb-1.5 block text-xs text-text-disabled">分类</label>
							<input
								id="detail-category"
								type="text"
								bind:value={editCategory}
								placeholder="例如：音乐、活动"
								class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
							/>
						</div>

						<!-- 推荐 -->
						<div class="flex items-center justify-between">
							<span class="text-xs text-text-disabled">推荐</span>
							<button
								type="button"
								onclick={() => (editIsRecommended = !editIsRecommended)}
								aria-label="推荐"
								class="relative h-5 w-9 rounded-full transition-colors {editIsRecommended ? 'bg-cf' : 'bg-border'}"
							>
								<span
									class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {editIsRecommended ? 'translate-x-4' : 'translate-x-0.5'}"
								></span>
							</button>
						</div>

						<!-- 内容 -->
						<div>
							<label for="detail-content" class="mb-1.5 block text-xs text-text-disabled">内容</label>
							<textarea
								id="detail-content"
								bind:value={editContent}
								rows="4"
								class="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary resize-none"
							></textarea>
						</div>

						{#if error}
							<p class="text-xs text-error">{error}</p>
						{/if}
					</div>
				{:else if announcement}
					<!-- 查看模式 -->
					<div class="space-y-4">
						{#if announcement.cover_file_key}
							<div class="w-full overflow-hidden rounded-md border border-border-primary" style="aspect-ratio: 16/9">
								<img
									src={getR2Url(announcement.cover_file_key)}
									alt="封面"
									class="h-full w-full object-cover"
								/>
							</div>
						{/if}

						<div>
							<span class="text-xs text-text-disabled">ID</span>
							<p class="mt-1 font-mono text-sm text-text-primary">{announcement.id}</p>
						</div>
						<div>
							<span class="text-xs text-text-disabled">标题</span>
							<p class="mt-1 text-sm text-text-primary">{announcement.title}</p>
						</div>
						{#if announcement.content}
							<div>
								<span class="text-xs text-text-disabled">内容</span>
								<p class="mt-1 text-sm text-text-primary whitespace-pre-wrap">{announcement.content}</p>
							</div>
						{/if}
						<div>
							<span class="text-xs text-text-disabled">分类</span>
							<p class="mt-1 text-sm text-text-primary">{announcement.category === 'music' ? '音乐' : announcement.category === 'activity' ? '活动' : '通用'}</p>
						</div>
						<div>
							<span class="text-xs text-text-disabled">推荐</span>
							<p class="mt-1 text-sm text-text-primary">{announcement.is_recommended === 'true' ? '是' : '否'}</p>
						</div>
						<div>
							<span class="text-xs text-text-disabled">创建时间</span>
							<p class="mt-1 text-xs text-text-disabled">{formatDate(announcement.created_at)}</p>
						</div>
						<div>
							<span class="text-xs text-text-disabled">更新时间</span>
							<p class="mt-1 text-xs text-text-disabled">{formatDate(announcement.updated_at)}</p>
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
				{:else if announcement}
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