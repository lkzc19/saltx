<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let {
		open = $bindable(false),
		onuploaded
	}: {
		open: boolean;
		onuploaded: () => void;
	} = $props();

	let name = $state('');
	let file = $state<File | null>(null);
	let uploading = $state(false);
	let error = $state('');

	let canSubmit = $derived(!!file && !uploading);

	function reset() {
		name = '';
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
			if (name) formData.set('name', name);
			formData.set('file', file!);

			const res = await fetch('/api/image', { method: 'POST', body: formData });
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
				<h2 class="text-base font-semibold text-text">上传图片</h2>
				<button onclick={close} class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">文件</label>
					<label class="flex h-24 cursor-pointer items-center justify-center rounded-md border border-border bg-bg-primary transition-colors hover:border-text-disabled">
						{#if file}
							<div class="text-center">
								<img src={URL.createObjectURL(file)} alt={file.name} class="mx-auto max-h-16 object-contain" />
								<p class="mt-1 text-xs text-text-muted">{file.name}</p>
							</div>
						{:else}
							<div class="text-text-disabled">
								<svg class="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<p class="mt-1 text-xs">点击选择图片</p>
							</div>
						{/if}
						<input type="file" accept="image/*" class="hidden" onchange={(e) => (file = (e.target as HTMLInputElement).files?.[0] ?? null)} />
					</label>
				</div>
				<div>
					<label class="mb-1.5 block text-xs text-text-disabled">名称（可选）</label>
					<input type="text" bind:value={name} placeholder={file?.name ?? "图片名称"} class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary" />
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