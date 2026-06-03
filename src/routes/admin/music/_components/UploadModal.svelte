<script lang="ts">
	import ImagePickerModal from './ImagePickerModal.svelte';
	import { getOriginalUrl } from '$lib/utils/music';
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
	let file = $state<File | null>(null);
	let coverImage = $state<Image | null>(null);
	let pickerOpen = $state(false);
	let uploading = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) {
			name = '';
			artist = '';
			file = null;
			coverImage = null;
			error = '';
		}
	});

	function close() {
		open = false;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim() || !artist.trim() || !file || uploading) return;
		uploading = true;
		error = '';

		try {
			const formData = new FormData();
			formData.set('name', name);
			formData.set('artist', artist);
			formData.set('file', file!);
			if (coverImage) {
				formData.set('cover_file_key', coverImage.file_key);
			}

			const res = await fetch('/api/admin/music', { method: 'POST', body: formData });
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
			class="w-full max-w-md rounded-lg border border-border-primary bg-fg p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mb-5 flex items-center justify-between">
				<h2 class="text-base font-semibold text-text-primary">新增音乐</h2>
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

			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- 封面 -->
				<div>
					<p class="mb-1.5 text-xs text-text-disabled">封面（可选）</p>
					<div class="flex items-center gap-3">
						{#if coverImage}
							<div class="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border-primary">
								<img
									src={getOriginalUrl(coverImage.file_key)}
									alt={coverImage.name}
									class="h-full w-full object-cover"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-xs text-text-primary">{coverImage.name}</p>
							</div>
							<button
								type="button"
								onclick={() => (coverImage = null)}
								class="shrink-0 text-xs text-text-disabled hover:text-error"
							>
								移除
							</button>
						{:else}
							<button
								type="button"
								onclick={() => (pickerOpen = true)}
								class="h-12 rounded-md border border-border-primary px-4 text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary"
							>
								选择封面
							</button>
						{/if}
					</div>
				</div>

				<!-- 名称 -->
				<div>
					<label for="upload-name" class="mb-1.5 block text-xs text-text-disabled">名称</label>
					<input
						id="upload-name"
						type="text"
						bind:value={name}
						required
						placeholder="请输入音乐名称"
						class="h-9 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
					/>
				</div>

				<!-- 艺术家 -->
				<div>
					<label for="upload-artist" class="mb-1.5 block text-xs text-text-disabled">艺术家</label>
					<input
						id="upload-artist"
						type="text"
						bind:value={artist}
						required
						placeholder="请输入艺术家名称"
						class="h-9 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
					/>
				</div>

				<!-- 文件 -->
				<div>
					<label for="upload-file" class="mb-1.5 block text-xs text-text-disabled">音频文件</label>
					<label class="flex h-9 cursor-pointer items-center rounded-md border border-border-primary bg-bg-primary px-3 text-sm transition-colors hover:border-text-disabled">
						<span class={file ? 'text-text-primary' : 'text-text-disabled'}>
							{file ? file.name : '选择音频文件'}
						</span>
						<input
							id="upload-file"
							type="file"
							accept="audio/*"
							class="hidden"
							onchange={(e) => (file = (e.target as HTMLInputElement).files?.[0] ?? null)}
						/>
					</label>
				</div>

				{#if error}
					<p class="text-xs text-error">{error}</p>
				{/if}

				<div class="flex gap-2 pt-1">
					<button
						type="button"
						onclick={close}
						class="h-9 flex-1 rounded-md border border-border-primary text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary"
					>
						取消
					</button>
					<button
						type="submit"
						disabled={uploading || !name.trim() || !artist.trim() || !file}
						class="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{#if uploading}
							<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
