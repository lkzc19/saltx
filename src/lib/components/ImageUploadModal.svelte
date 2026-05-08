<script lang="ts">
	import Cropper from 'svelte-easy-crop';
	import type { CropArea } from 'svelte-easy-crop';

	let {
		open = $bindable(false),
		onuploaded
	}: {
		open: boolean;
		onuploaded: () => void;
	} = $props();

	type Step = 'select' | 'crop';

	let step = $state<Step>('select');
	let name = $state('');
	let imageUrl = $state('');
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels = $state<CropArea | null>(null);
	let uploading = $state(false);
	let error = $state('');

	let fileInput = $state<HTMLInputElement | undefined>(undefined);

	function handleFileSelect(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		name = f.name.replace(/\.[^/.]+$/, '');
		if (imageUrl) URL.revokeObjectURL(imageUrl);
		imageUrl = URL.createObjectURL(f);
		crop = { x: 0, y: 0 };
		zoom = 1;
		croppedAreaPixels = null;
		step = 'crop';
	}

	function handleCropComplete(e: { pixels: CropArea }) {
		croppedAreaPixels = e.pixels;
	}

	async function generateFiles(): Promise<{ croppedFile: File; thumbnailFile: File }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const px = croppedAreaPixels!;

				const canvas = document.createElement('canvas');
				canvas.width = px.width;
				canvas.height = px.height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);

				const thumbCanvas = document.createElement('canvas');
				thumbCanvas.width = 200;
				thumbCanvas.height = 200;
				thumbCanvas.getContext('2d')!.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, 200, 200);

				const toBlob = (c: HTMLCanvasElement, quality: number) =>
					new Promise<Blob>((res, rej) =>
						c.toBlob((b) => (b ? res(b) : rej(new Error('canvas toBlob failed'))), 'image/webp', quality)
					);

				Promise.all([toBlob(canvas, 0.9), toBlob(thumbCanvas, 0.8)])
					.then(([croppedBlob, thumbBlob]) => {
						resolve({
							croppedFile: new File([croppedBlob], 'image.webp', { type: 'image/webp' }),
							thumbnailFile: new File([thumbBlob], 'thumb.webp', { type: 'image/webp' })
						});
					})
					.catch(reject);
			};
			img.onerror = reject;
			img.src = imageUrl;
		});
	}

	async function handleSubmit() {
		if (!croppedAreaPixels || uploading) return;
		uploading = true;
		error = '';

		try {
			const { croppedFile, thumbnailFile } = await generateFiles();

			const formData = new FormData();
			if (name) formData.set('name', name);
			formData.set('file', croppedFile);
			formData.set('thumbnail', thumbnailFile);
			formData.set('aspect_ratio', '1:1');

			const res = await fetch('/api/admin/image', { method: 'POST', body: formData });
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

	function backToSelect() {
		step = 'select';
		if (fileInput) fileInput.value = '';
	}

	function close() {
		if (imageUrl) URL.revokeObjectURL(imageUrl);
		imageUrl = '';
		name = '';
		error = '';
		step = 'select';
		uploading = false;
		if (fileInput) fileInput.value = '';
		open = false;
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
			class="w-full max-w-lg rounded-lg border border-border bg-bg-card p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="mb-5 flex items-center justify-between">
				<h2 class="text-base font-semibold text-text">上传图片</h2>
				<button
					onclick={close}
					class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{#if step === 'select'}
				<!-- 选择文件 -->
				<label
					class="flex h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-bg-primary transition-colors hover:border-text-disabled"
				>
					<svg class="mb-2 h-10 w-10 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<p class="text-sm text-text-disabled">点击选择图片</p>
					<p class="mt-1 text-xs text-text-disabled opacity-60">支持 JPG、PNG、WebP</p>
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						class="hidden"
						onchange={handleFileSelect}
					/>
				</label>
			{:else}
				<!-- 裁剪步骤 -->
				<div class="space-y-4">
					<!-- 裁剪区域 -->
					<div class="relative h-72 overflow-hidden rounded-md bg-black">
						<Cropper
							image={imageUrl}
							bind:crop
							bind:zoom
							aspect={1}
							oncropcomplete={handleCropComplete}
						/>
					</div>

					<!-- 缩放滑块 -->
					<div class="flex items-center gap-3">
						<svg class="h-4 w-4 shrink-0 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
						</svg>
						<input
							type="range"
							min="1"
							max="3"
							step="0.01"
							bind:value={zoom}
							class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
						/>
						<svg class="h-5 w-5 shrink-0 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10h-6" />
						</svg>
					</div>

					<!-- 名称 -->
					<div>
						<label class="mb-1.5 block text-xs text-text-disabled">名称</label>
						<input
							type="text"
							bind:value={name}
							placeholder="图片名称"
							class="h-9 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
						/>
					</div>

					{#if error}
						<p class="text-xs text-error">{error}</p>
					{/if}

					<!-- 操作按钮 -->
					<div class="flex justify-between pt-1">
						<button
							type="button"
							onclick={backToSelect}
							class="h-9 rounded-md border border-border px-4 text-sm text-text-muted transition-colors hover:bg-border hover:text-text"
						>
							重新选择
						</button>
						<button
							type="button"
							onclick={handleSubmit}
							disabled={!croppedAreaPixels || uploading}
							class="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							{#if uploading}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
							{/if}
							上传
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
