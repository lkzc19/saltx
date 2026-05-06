<script lang="ts">
	import { goto } from '$app/navigation';

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
	let uploading = $state(false);
	let error = $state('');

	let canSubmit = $derived(name && artist && version && file && !uploading);

	function reset() {
		name = '';
		artist = '';
		version = '';
		file = null;
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

			const res = await fetch('/api/music', { method: 'POST', body: formData });
			if (!res.ok) {
				const body = await res.json() as { error?: string };
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="w-full max-w-md rounded-lg border border-border bg-bg-card p-6 shadow-2xl" onclick={(e) => e.stopPropagation()}>
			<div class="mb-5 flex items-center justify-between">
				<h2 class="text-base font-semibold text-text">新增音乐</h2>
				<button onclick={close} class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">名称</label>
					<input type="text" bind:value={name} placeholder="音乐名称" class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary" />
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">艺术家</label>
					<input type="text" bind:value={artist} placeholder="音乐人" class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary" />
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">版本</label>
					<input type="text" bind:value={version} placeholder="如：原版、Live版、Remix" class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary" />
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">文件</label>
					<label class="flex h-9 cursor-pointer items-center rounded-md border border-border bg-bg-primary px-3 text-sm transition-colors hover:border-text-disabled">
						<span class={file ? 'text-text' : 'text-text-disabled'}>{file ? file.name : '选择音乐文件'}</span>
						<input type="file" accept="audio/*" class="hidden" onchange={(e) => (file = (e.target as HTMLInputElement).files?.[0] ?? null)} />
					</label>
				</div>

				{#if error}
					<p class="text-xs text-error">{error}</p>
				{/if}

				<div class="flex justify-end gap-2 pt-2">
					<button type="button" onclick={close} class="h-9 rounded-md border border-border px-4 text-sm text-text-muted transition-colors hover:bg-border hover:text-text">取消</button>
					<button type="submit" disabled={!canSubmit} class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50">
						{#if uploading}
							<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
