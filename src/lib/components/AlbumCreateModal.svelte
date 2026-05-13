<script lang="ts">
	import type { Album, Image } from '$lib/types/music';
	import ImagePickerModal from './ImagePickerModal.svelte';

	let {
		open = $bindable(false),
		oncreated
	}: {
		open: boolean;
		oncreated: (album: Album) => void;
	} = $props();

	let name = $state('');
	let artist = $state('');
	let description = $state('');
	let coverFileKey = $state<string | null>(null);
	let saving = $state(false);
	let error = $state('');
	let pickerOpen = $state(false);

	$effect(() => {
		if (open) {
			name = '';
			artist = '';
			description = '';
			coverFileKey = null;
			error = '';
		}
	});

	function handleCoverSelect(img: Image) {
		coverFileKey = img.file_key;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim() || saving) return;
		saving = true;
		error = '';

		try {
			const res = await fetch('/api/admin/album', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					artist: artist.trim() || null,
					description: description.trim() || null,
					cover_file_key: coverFileKey
				})
			});
			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body.error ?? '创建失败');
			}
			const album = (await res.json()) as Album;
			oncreated(album);
			open = false;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onclick={() => (open = false)}
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-md rounded-lg border border-border bg-bg-card shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 class="text-base font-semibold text-text">新增专辑</h2>
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

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-4 p-5">
				<!-- 封面 -->
				<div>
					<p class="mb-2 text-xs text-text-disabled">封面（可选）</p>
					<div class="flex items-center gap-3">
						<div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-bg-primary">
							{#if coverFileKey}
								<img src={`/files/${coverFileKey}`} alt="封面" class="h-full w-full object-cover" />
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
								{coverFileKey ? '更换封面' : '选择封面'}
							</button>
							{#if coverFileKey}
								<button
									type="button"
									onclick={() => (coverFileKey = null)}
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
					<label for="create-album-name" class="mb-1.5 block text-xs text-text-disabled">专辑名称 <span class="text-error">*</span></label>
					<input
						id="create-album-name"
						type="text"
						bind:value={name}
						required
						placeholder="请输入专辑名称"
						class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
					/>
				</div>

				<!-- 艺术家 -->
				<div>
					<label for="create-album-artist" class="mb-1.5 block text-xs text-text-disabled">艺术家/乐队（可选）</label>
					<input
						id="create-album-artist"
						type="text"
						bind:value={artist}
						placeholder="请输入艺术家名称"
						class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
					/>
				</div>

				<!-- 简介 -->
				<div>
					<label for="create-album-desc" class="mb-1.5 block text-xs text-text-disabled">简介（可选）</label>
					<textarea
						id="create-album-desc"
						bind:value={description}
						rows="3"
						placeholder="请输入专辑简介"
						class="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary resize-none"
					></textarea>
				</div>

				{#if error}
					<p class="text-xs text-error">{error}</p>
				{/if}

				<div class="flex gap-2 pt-1">
					<button
						type="button"
						onclick={() => (open = false)}
						class="h-9 flex-1 rounded-md border border-border text-sm text-text-muted transition-colors hover:bg-border hover:text-text"
					>
						取消
					</button>
					<button
						type="submit"
						disabled={saving || !name.trim()}
						class="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{#if saving}
							<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
						{/if}
						创建专辑
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<ImagePickerModal bind:open={pickerOpen} onselect={handleCoverSelect} />
