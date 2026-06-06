<script lang="ts">
	import Cropper from 'svelte-easy-crop';
	import type { CropArea } from 'svelte-easy-crop';
	import type { Image } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';
	import { formatDate } from '$lib/utils/date';
	import { getMatchingBackgroundColor } from '$lib/utils/image-color';
	import { adminState } from '$lib/stores/admin.svelte';
	import Scrollbar from '$lib/components/Scrollbar.svelte';

	let {
		image,
		oncreated,
		onsaved,
		ondeleted
	}: {
		image: Image | null;
		oncreated: () => void;
		onsaved: () => void;
		ondeleted: () => void;
	} = $props();

	let editing = $state(false);
	let name = $state('');
	let imageUrl = $state('');
	let stagingUrl = $state('');
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels = $state<CropArea | null>(null);
	let uploading = $state(false);
	let error = $state('');
	let fileInput: HTMLInputElement | undefined = $state(undefined);
	let cropOpen = $state(false);

	let isAdding = $derived(adminState.addingImage);
	let hasNewImage = $derived(!!imageUrl);

	export function reset() {
		editing = false;
		name = '';
		if (imageUrl) URL.revokeObjectURL(imageUrl);
		imageUrl = '';
		if (stagingUrl) URL.revokeObjectURL(stagingUrl);
		stagingUrl = '';
		crop = { x: 0, y: 0 };
		zoom = 1;
		croppedAreaPixels = null;
		uploading = false;
		error = '';
		cropOpen = false;
		if (fileInput) fileInput.value = '';
	}

	function close() {
		adminState.addingImage = false;
		adminState.selectedImage = null;
		reset();
	}

	function startEdit() {
		if (!image) return;
		editing = true;
		name = image.name;
		imageUrl = '';
		stagingUrl = '';
		croppedAreaPixels = null;
		error = '';
	}

	function cancelEdit() {
		editing = false;
		if (imageUrl) URL.revokeObjectURL(imageUrl);
		imageUrl = '';
		if (stagingUrl) URL.revokeObjectURL(stagingUrl);
		stagingUrl = '';
		error = '';
		if (fileInput) fileInput.value = '';
	}

	function handleFileSelect(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		if (!editing && !imageUrl) name = f.name.replace(/\.[^/.]+$/, '');
		if (stagingUrl) URL.revokeObjectURL(stagingUrl);
		stagingUrl = URL.createObjectURL(f);
		crop = { x: 0, y: 0 };
		zoom = 1;
		croppedAreaPixels = null;
		cropOpen = true;
	}

	function confirmCrop() {
		cropOpen = false;
		if (stagingUrl) {
			if (imageUrl) URL.revokeObjectURL(imageUrl);
			imageUrl = stagingUrl;
			stagingUrl = '';
		}
	}

	function cancelCrop() {
		cropOpen = false;
		if (stagingUrl) URL.revokeObjectURL(stagingUrl);
		stagingUrl = '';
		croppedAreaPixels = null;
		if (!imageUrl && !editing) {
			name = '';
		}
		if (fileInput) fileInput.value = '';
	}

	function handleCropComplete(e: { pixels: CropArea }) {
		croppedAreaPixels = e.pixels;
	}

	async function generateFiles(): Promise<{ croppedFile: File; backgroundColor: string }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const px = croppedAreaPixels!;
				const canvas = document.createElement('canvas');
				canvas.width = px.width;
				canvas.height = px.height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);

				const toBlob = (c: HTMLCanvasElement, quality: number) =>
					new Promise<Blob>((res, rej) =>
						c.toBlob((b) => (b ? res(b) : rej(new Error('canvas toBlob failed'))), 'image/webp', quality)
					);

				toBlob(canvas, 0.9)
					.then((croppedBlob) => {
						resolve({
							croppedFile: new File([croppedBlob], 'image.webp', { type: 'image/webp' }),
							backgroundColor: getMatchingBackgroundColor(canvas)
						});
					})
					.catch(reject);
			};
			img.onerror = reject;
			img.src = imageUrl;
		});
	}

	async function handleCreate() {
		if (!croppedAreaPixels || uploading) return;
		uploading = true;
		error = '';

		try {
			const { croppedFile, backgroundColor } = await generateFiles();
			const formData = new FormData();
			if (name) formData.set('name', name);
			formData.set('file', croppedFile);
			formData.set('aspect_ratio', '1:1');
			formData.set('background_color', backgroundColor);

			const res = await fetch('/api/admin/image', { method: 'POST', body: formData });
			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body.error ?? '创建失败');
			}
			reset();
			oncreated();
		} catch (err) {
			error = (err as Error).message;
		} finally {
			uploading = false;
		}
	}

	async function handleSave() {
		if (!image || uploading) return;
		uploading = true;
		error = '';

		try {
			const formData = new FormData();
			formData.set('name', name);

			if (croppedAreaPixels && imageUrl) {
				const { croppedFile, backgroundColor } = await generateFiles();
				formData.set('file', croppedFile);
				formData.set('aspect_ratio', '1:1');
				formData.set('background_color', backgroundColor);
			}

			const res = await fetch(`/api/admin/image?id=${image.id}`, { method: 'PUT', body: formData });
			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body.error ?? '保存失败');
			}
			reset();
			onsaved();
		} catch (err) {
			error = (err as Error).message;
		} finally {
			uploading = false;
		}
	}

	async function handleDelete() {
		if (!image || !confirm(`确定要删除「${image.name}」吗？`)) return;

		const res = await fetch(`/api/admin/image?id=${image.id}`, { method: 'DELETE' });
		if (!res.ok) {
			const body = (await res.json()) as { error?: string };
			error = body.error ?? '删除失败';
			return;
		}
		ondeleted();
	}
</script>

{#if image || isAdding}
	<aside class="flex w-80 shrink-0 flex-col overflow-hidden border-l border-border-primary bg-fg">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border-primary px-4 py-4">
			<h3 class="text-sm font-semibold text-text-primary">
				{isAdding ? '上传图片' : editing ? '编辑图片' : '图片详情'}
			</h3>
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

		<!-- 内容区 -->
		<div class="min-h-0 flex flex-1 flex-col">
			<Scrollbar class="min-h-0 flex-1">
				<div class="p-4">
					{#if isAdding}
						<!-- 新增模式 -->
						<div class="space-y-4">
							{#if !hasNewImage}
								<div
									class="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border-primary bg-bg-secondary transition-colors hover:border-text-disabled"
									style="aspect-ratio: 1/1"
									onclick={() => fileInput?.click()}
									onkeydown={() => {}}
									role="button"
									tabindex="0"
								>
									<svg class="mb-2 h-8 w-8 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
									</svg>
									<p class="text-sm text-text-disabled">点击选择图片</p>
									<p class="mt-1 text-xs text-text-disabled opacity-60">支持 JPG、PNG、WebP</p>
								</div>
							{:else}
								<div
									class="group relative w-full cursor-pointer overflow-hidden rounded-md border border-border-primary"
									style="aspect-ratio: 1/1"
								>
									<img src={imageUrl} alt="" class="h-full w-full object-cover" />
									<div class="absolute inset-0 flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
										<button
											type="button"
											onclick={() => fileInput?.click()}
											class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60"
										>
											重新上传
										</button>
										<button
											type="button"
											onclick={() => { cropOpen = true; }}
											class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60"
										>
											重新裁剪
										</button>
									</div>
								</div>
							{/if}

							<div>
								<label for="image-name" class="mb-1.5 block text-xs text-text-disabled">名称</label>
								<input
									id="image-name"
									type="text"
									bind:value={name}
									placeholder="图片名称"
									class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
								/>
							</div>

							{#if error}
								<p class="text-xs text-error">{error}</p>
							{/if}
						</div>
					{:else if editing}
						<!-- 编辑模式 -->
						<div class="space-y-4">
							<div
								class="group relative w-full cursor-pointer overflow-hidden rounded-md border border-border-primary"
								style="aspect-ratio: 1/1"
							>
								{#if hasNewImage}
									<img src={imageUrl} alt="" class="h-full w-full object-cover" />
								{:else if image}
									<img src={getR2Url(image.file_key)} alt={image.name} class="h-full w-full object-cover" />
								{/if}
								<div class="absolute inset-0 flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
									<button
										type="button"
										onclick={() => fileInput?.click()}
										class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60"
									>
										重新上传
									</button>
									{#if hasNewImage}
										<button
											type="button"
											onclick={() => { cropOpen = true; }}
											class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60"
										>
											重新裁剪
										</button>
									{/if}
								</div>
							</div>

							<div>
								<label for="edit-image-name" class="mb-1.5 block text-xs text-text-disabled">名称</label>
								<input
									id="edit-image-name"
									type="text"
									bind:value={name}
									placeholder="图片名称"
									class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
								/>
							</div>

							{#if error}
								<p class="text-xs text-error">{error}</p>
							{/if}
						</div>
					{:else if image}
						<!-- 查看模式 -->
						<div class="space-y-4">
							<div class="w-full overflow-hidden rounded-md border border-border-primary" style="aspect-ratio: 1/1">
								<img
									src={getR2Url(image.file_key)}
									alt={image.name}
									class="h-full w-full object-cover"
								/>
							</div>

							<div>
								<span class="text-xs text-text-disabled">名称</span>
								<p class="mt-1 text-sm text-text-primary">{image.name}</p>
							</div>
							<div>
								<span class="text-xs text-text-disabled">格式</span>
								<p class="mt-1 text-sm text-text-primary">{image.extension.toUpperCase()}</p>
							</div>
							<div>
								<span class="text-xs text-text-disabled">比例</span>
								<p class="mt-1 text-sm text-text-primary">{image.aspect_ratio}</p>
							</div>
							{#if image.background_color}
								<div>
									<span class="text-xs text-text-disabled">背景色</span>
									<div class="mt-1 flex items-center gap-2">
										<span
											class="inline-block h-4 w-4 rounded border border-border-primary"
											style:background-color={image.background_color}
										></span>
										<span class="text-sm text-text-primary">{image.background_color}</span>
									</div>
								</div>
							{/if}
							<div>
								<span class="text-xs text-text-disabled">创建时间</span>
								<p class="mt-1 text-xs text-text-disabled">{formatDate(image.created_at)}</p>
							</div>
							<div>
								<span class="text-xs text-text-disabled">更新时间</span>
								<p class="mt-1 text-xs text-text-disabled">{formatDate(image.updated_at)}</p>
							</div>
						</div>
					{/if}
				</div>
			</Scrollbar>

			<!-- 按钮区 -->
			<div class="flex min-h-18 items-center border-t border-border-primary px-4">
				{#if isAdding}
					<div class="flex w-full gap-2">
						<button
							type="button"
							onclick={close}
							class="h-8 flex-1 rounded-md border border-border-primary text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary"
						>
							取消
						</button>
						<button
							type="button"
							onclick={handleCreate}
							disabled={!hasNewImage || !croppedAreaPixels || uploading}
							class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-cf text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							{#if uploading}
								<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
							{/if}
							创建
						</button>
					</div>
				{:else if editing}
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
							disabled={uploading}
							class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-cf text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
						>
							{#if uploading}
								<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
							{/if}
							保存
						</button>
					</div>
				{:else if image}
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
		<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={handleFileSelect} />
	</aside>
{/if}

<!-- 裁剪模态框 -->
{#if cropOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
		<div class="flex min-h-0 w-full max-w-2xl flex-1 items-center justify-center px-6 py-4">
			<div class="relative aspect-square w-full overflow-hidden bg-black">
				<Cropper
					image={stagingUrl}
					bind:crop
					bind:zoom
					aspect={1}
					oncropcomplete={handleCropComplete}
				/>
			</div>
		</div>
		<div class="flex w-full max-w-2xl gap-3 px-6 pb-6">
			<button
				type="button"
				onclick={cancelCrop}
				class="h-9 flex-1 rounded-md border border-white/20 text-sm text-white/80 transition-colors hover:bg-white/10"
			>
				取消
			</button>
			<button
				type="button"
				onclick={confirmCrop}
				class="h-9 flex-1 rounded-md bg-cf text-sm font-medium text-white transition-opacity hover:opacity-90"
			>
				确认
			</button>
		</div>
	</div>
{/if}
