<script lang="ts">
	import ImagePickerModal from './ImagePickerModal.svelte';
	import { getThumbnailUrl } from '$lib/utils/music';
	import type { Image } from '$lib/types/music';

	let {
		open = $bindable(false),
		onuploaded
	}: {
		open: boolean;
		onuploaded: () => void;
	} = $props();

	let name = $state('');
	let artist = $state('');
	let version = $state('');
	let file = $state<File | null>(null);
	let coverImage = $state<Image | null>(null);
	let pickerOpen = $state(false);
	let uploading = $state(false);
	let error = $state('');

	let canSubmit = $derived(name && artist && version && file && !uploading);

	function reset() {
		name = '';
		artist = '';
		version = '';
		file = null;
		coverImage = null;
		error = '';
	}

	function close() {
		reset();
		open = false;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!canSubmit) return;

		uploading = true;
		error = '';

		try {
			const formData = new FormData();
			formData.set('name', name);
			formData.set('artist', artist);
			formData.set('version', version);
			formData.set('file', file!);
			if (coverImage) {
				const key = coverImage.thumbnail_key ?? coverImage.file_key;
				if (key) formData.set('cover_file_key', key);
			}

			const res = await fetch('/api/music', { method: 'POST', body: formData });
			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body.error ?? '上传失败');
			}
			onuploaded();
			close();
		} catch (err) {
			error = (err as Error).message;
		} finally {
			uploading = false;
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-md rounded-lg border border-border bg-bg-card p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-5 flex items-center justify-between">
				<h2 class="text-base font-semibold text-text">新增音乐</h2>
				<button
					onclick={close}
					class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text"
					aria-label="关闭"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">名称</label>
					<input
						type="text"
						bind:value={name}
						placeholder="音乐名称"
						class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
					/>
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">艺术家</label>
					<input
						type="text"
						bind:value={artist}
						placeholder="音乐人"
						class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
					/>
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">版本</label>
					<input
						type="text"
						bind:value={version}
						placeholder="如：原版、Live版、Remix"
						class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
					/>
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">文件</label>
					<label
						class="flex h-9 cursor-pointer items-center rounded-md border border-border bg-bg-primary px-3 text-sm transition-colors hover:border-text-disabled"
					>
						<span class={file ? 'text-text' : 'text-text-disabled'}
							>{file ? file.name : '选择音乐文件'}</span
						>
						<input
							type="file"
							accept="audio/*"
							class="hidden"
							onchange={(e) => (file = (e.target as HTMLInputElement).files?.[0] ?? null)}
						/>
					</label>
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">封面（可选）</label>
					<div class="flex items-center gap-3">
						{#if coverImage}
							<div class="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
								{#if coverImage.thumbnail_key}
									<img
										src={getThumbnailUrl(coverImage)}
										alt={coverImage.name}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center bg-bg-primary text-text-disabled">
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
										</svg>
									</div>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-xs text-text">{coverImage.name}</p>
							</div>
							<button
								type="button"
								onclick={() => (coverImage = null)}
								class="shrink-0 text-xs text-text-disabled hover:text-error"
							>
								移除
							</button>
						{/if}
						<button
							type="button"
							onclick={() => (pickerOpen = true)}
							class="h-8 rounded-md border border-border px-3 text-xs text-text-muted transition-colors hover:bg-border hover:text-text"
						>
							{coverImage ? '更换封面' : '选择封面'}
						</button>
					</div>
				</div>

				{#if error}
					<p class="text-xs text-error">{error}</p>
				{/if}

				<div class="flex justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={close}
						class="h-9 rounded-md border border-border px-4 text-sm text-text-muted transition-colors hover:bg-border hover:text-text"
					>
						取消
					</button>
					<button
						type="submit"
						disabled={!canSubmit}
						class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{#if uploading}
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
						{/if}
						上传
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<ImagePickerModal bind:open={pickerOpen} onselect={(img) => (coverImage = img)} />
