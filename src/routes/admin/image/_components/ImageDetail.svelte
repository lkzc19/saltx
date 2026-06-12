<script lang="ts">
	import Cropper from 'svelte-easy-crop';
	import type { CropArea } from 'svelte-easy-crop';
	import type { Image } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';
	import { formatDate } from '$lib/utils/date';
	import { getMatchingBackgroundColor } from '$lib/utils/image-color';
	import { adminState } from '$lib/stores/admin.svelte';
	import Scrollbar from '$lib/components/Scrollbar.svelte';
	import { Select } from 'bits-ui';

	let {
		image, oncreated, onsaved, ondeleted
	}: {
		image: Image | null; oncreated: () => void; onsaved: () => void; ondeleted: () => void;
	} = $props();

	interface ColorEntry { color: string; algorithm: string }
	interface BgColors { auto: ColorEntry[]; manual: string[]; active: string }

	let editing = $state(false);
	let editingImage: Image | null = $state(null);
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

	let bgColors = $state<BgColors>({ auto: [], manual: [], active: '' });
	let samplingOpen = $state(false);
	let hoveredColor = $state<string | null>(null);
	let sampleCanvas: HTMLCanvasElement | undefined = $state(undefined);
	let lensX = $state(0);
	let lensY = $state(0);
	let lensVisible = $state(false);
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let magnifierCanvas: HTMLCanvasElement | undefined = $state(undefined);

	let isAdding = $derived(adminState.addingImage);
	let hasNewImage = $derived(!!imageUrl);
	let viewBg = $derived(image ? parseBg(image.background_colors) : null);

	function parseBg(raw: string | null): BgColors {
		if (!raw) return { auto: [], manual: [], active: '' };
		try { return JSON.parse(raw); } catch { return { auto: [], manual: [], active: '' }; }
	}

	function rgbToHex(r: number, g: number, b: number): string {
		return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
	}

	export function reset() {
		editing = false; editingImage = null; name = '';
		if (imageUrl) URL.revokeObjectURL(imageUrl); imageUrl = '';
		if (stagingUrl) URL.revokeObjectURL(stagingUrl); stagingUrl = '';
		crop = { x: 0, y: 0 }; zoom = 1; croppedAreaPixels = null;
		uploading = false; error = ''; cropOpen = false;
		bgColors = { auto: [], manual: [], active: '' };
		samplingOpen = false; hoveredColor = null;
		if (fileInput) fileInput.value = '';
	}

	function close() { adminState.addingImage = false; adminState.selectedImage = null; reset(); }

	function startEdit() {
		if (!image) return;
		editingImage = image; editing = true;
		name = image.name; imageUrl = ''; stagingUrl = '';
		croppedAreaPixels = null; bgColors = parseBg(image.background_colors); error = '';
	}

	function cancelEdit() {
		editing = false; editingImage = null;
		if (imageUrl) URL.revokeObjectURL(imageUrl); imageUrl = '';
		if (stagingUrl) URL.revokeObjectURL(stagingUrl); stagingUrl = '';
		bgColors = { auto: [], manual: [], active: '' };
		samplingOpen = false; hoveredColor = null; error = '';
		if (fileInput) fileInput.value = '';
	}

	function handleFileSelect(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		if (!editing && !imageUrl) name = f.name.replace(/\.[^/.]+$/, '');
		if (stagingUrl) URL.revokeObjectURL(stagingUrl);
		stagingUrl = URL.createObjectURL(f);
		crop = { x: 0, y: 0 }; zoom = 1; croppedAreaPixels = null; cropOpen = true;
	}

	function confirmCrop() {
		cropOpen = false;
		if (!stagingUrl || !croppedAreaPixels) return;
		const src = stagingUrl; const px = croppedAreaPixels; stagingUrl = '';
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = px.width; canvas.height = px.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
			canvas.toBlob((blob) => {
				if (!blob) return;
				if (imageUrl) URL.revokeObjectURL(imageUrl);
				imageUrl = URL.createObjectURL(blob);
				const color = getMatchingBackgroundColor(canvas);
				bgColors = { auto: [{ color, algorithm: 'kmeans' }], manual: [], active: color };
				croppedAreaPixels = null;
			}, 'image/webp', 0.9);
		};
		img.src = src;
	}

	function cancelCrop() {
		cropOpen = false;
		if (stagingUrl) URL.revokeObjectURL(stagingUrl); stagingUrl = '';
		croppedAreaPixels = null;
		if (!imageUrl && !editing) name = '';
		if (fileInput) fileInput.value = '';
	}

	function handleCropComplete(e: { pixels: CropArea }) { croppedAreaPixels = e.pixels; }

	function openSampling() {
		samplingOpen = true; hoveredColor = null;
		const imgSrc = imageUrl || (image ? getR2Url(image.file_key) : '');
		if (!imgSrc || !sampleCanvas) return;
		const img = new Image(); img.crossOrigin = 'anonymous';
		img.onload = () => {
			if (!sampleCanvas) return;
			sampleCanvas.width = img.naturalWidth; sampleCanvas.height = img.naturalHeight;
			const ctx = sampleCanvas.getContext('2d');
			if (ctx) ctx.drawImage(img, 0, 0);
		};
		img.src = imgSrc;
	}

	function closeSampling() { samplingOpen = false; hoveredColor = null; lensVisible = false; }

	function handleSamplingMouseMove(e: MouseEvent) {
		if (!sampleCanvas) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = Math.floor(((e.clientX - rect.left) / rect.width) * sampleCanvas.width);
		const y = Math.floor(((e.clientY - rect.top) / rect.height) * sampleCanvas.height);
		lensX = e.clientX - rect.left; lensY = e.clientY - rect.top; lensVisible = true;
		containerWidth = rect.width; containerHeight = rect.height;
		const ctx = sampleCanvas.getContext('2d');
		if (!ctx) return;
		const pixel = ctx.getImageData(x, y, 1, 1).data;
		hoveredColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
		if (magnifierCanvas) {
			const mCtx = magnifierCanvas.getContext('2d');
			if (mCtx) {
				const z = 8, p = 19, s = z * p;
				mCtx.clearRect(0, 0, s, s); mCtx.imageSmoothingEnabled = false;
				mCtx.drawImage(sampleCanvas, x - (p - 1) / 2, y - (p - 1) / 2, p, p, 0, 0, s, s);
			}
		}
	}

	function handleSamplingClick() {
		if (!hoveredColor) return;
		if (!bgColors.manual.includes(hoveredColor) && !bgColors.auto.some((c) => c.color === hoveredColor)) {
			bgColors.manual = [...bgColors.manual, hoveredColor];
		}
	}

	function removeManualColor(index: number) { bgColors.manual = bgColors.manual.filter((_, i) => i !== index); }
	function setActiveColor(color: string) { bgColors.active = color; }

	async function recalculate() {
		if (!image) return;
		uploading = true;
		try {
			const img = new Image();
			img.onload = async () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) return;
				ctx.drawImage(img, 0, 0);
				const color = getMatchingBackgroundColor(canvas);
				const res = await fetch(`/api/admin/image/recalculate?id=${image.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color }) });
				const data = await res.json();
				if (!res.ok) throw new Error((data as { error?: string }).error ?? '重新计算失败');
				bgColors = parseBg((data as Image).background_colors);
				onsaved();
			};
			img.src = imageUrl || getR2Url(image.file_key);
		} catch (err) { error = (err as Error).message; } finally { uploading = false; }
	}

	async function generateFiles(): Promise<{ croppedFile: File; backgroundColor: string }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const px = croppedAreaPixels;
				const canvas = document.createElement('canvas');
				if (px) { canvas.width = px.width; canvas.height = px.height; }
				else { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; }
				const ctx = canvas.getContext('2d');
				if (!ctx) return reject(new Error('canvas getContext failed'));
				if (px) ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
				else ctx.drawImage(img, 0, 0);
				canvas.toBlob((blob) => {
					if (!blob) return reject(new Error('canvas toBlob failed'));
					resolve({ croppedFile: new File([blob], 'image.webp', { type: 'image/webp' }), backgroundColor: getMatchingBackgroundColor(canvas) });
				}, 'image/webp', 0.9);
			};
			img.onerror = reject; img.src = imageUrl;
		});
	}

	async function handleCreate() {
		if (!imageUrl || uploading) return;
		uploading = true; error = '';
		try {
			const { croppedFile, backgroundColor } = await generateFiles();
			const formData = new FormData();
			if (name) formData.set('name', name);
			formData.set('file', croppedFile); formData.set('aspect_ratio', '1:1'); formData.set('background_color', backgroundColor);
			const res = await fetch('/api/admin/image', { method: 'POST', body: formData });
			if (!res.ok) { const body = (await res.json()) as { error?: string }; throw new Error(body.error ?? '创建失败'); }
			reset(); oncreated();
		} catch (err) { error = (err as Error).message; } finally { uploading = false; }
	}

	async function handleSave() {
		if (!editingImage || uploading) return;
		uploading = true; error = '';
		try {
			const formData = new FormData();
			formData.set('name', name); formData.set('background_colors', JSON.stringify(bgColors));
			if (croppedAreaPixels && imageUrl) {
				const { croppedFile, backgroundColor } = await generateFiles();
				formData.set('file', croppedFile); formData.set('aspect_ratio', '1:1'); formData.set('background_color', backgroundColor);
			}
			const res = await fetch(`/api/admin/image?id=${editingImage.id}`, { method: 'PUT', body: formData });
			if (!res.ok) { const body = (await res.json()) as { error?: string }; throw new Error(body.error ?? '保存失败'); }
			adminState.selectedImage = editingImage;
			reset(); onsaved();
		} catch (err) { error = (err as Error).message; } finally { uploading = false; }
	}

	async function handleDelete() {
		if (!image || !confirm(`确定要删除「${image.name}」吗？`)) return;
		const res = await fetch(`/api/admin/image?id=${image.id}`, { method: 'DELETE' });
		if (!res.ok) { const body = (await res.json()) as { error?: string }; error = body.error ?? '删除失败'; return; }
		ondeleted();
	}
</script>

<canvas bind:this={sampleCanvas} class="hidden"></canvas>

{#if image || isAdding}
	<aside class="flex w-80 shrink-0 flex-col overflow-hidden border-l border-border-primary bg-fg">
		<div class="flex items-center justify-between border-b border-border-primary px-4 py-4">
			<h3 class="text-sm font-semibold text-text-primary">{isAdding ? '上传图片' : editing ? '编辑图片' : '图片详情'}</h3>
			<button onclick={close} class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text-primary" aria-label="关闭">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
		</div>

		<div class="flex flex-1 flex-col min-h-0">
			<Scrollbar class="flex-1 min-h-0">
				<div class="p-4">
					{#if isAdding}
						<div class="space-y-4">
							{#if !hasNewImage}
								<div class="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border-primary bg-bg-secondary transition-colors hover:border-text-disabled" style="aspect-ratio: 1/1" onclick={() => fileInput?.click()} onkeydown={() => {}} role="button" tabindex="0">
									<svg class="mb-2 h-8 w-8 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" /></svg>
									<p class="text-sm text-text-disabled">点击选择图片</p>
									<p class="mt-1 text-xs text-text-disabled opacity-60">支持 JPG、PNG、WebP</p>
								</div>
							{:else}
								<div class="group relative w-full cursor-pointer overflow-hidden rounded-md border border-border-primary" style="aspect-ratio: 1/1">
									<img src={imageUrl} alt="" class="h-full w-full object-cover" />
									<div class="absolute inset-0 flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
										<button type="button" onclick={() => fileInput?.click()} class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60">重新上传</button>
									</div>
								</div>
								<button type="button" onclick={openSampling} class="w-full rounded-md border border-border-primary py-2 text-sm text-text-primary transition-colors hover:bg-border">取色</button>
								{#if bgColors.auto.length > 0 || bgColors.manual.length > 0}
									<div class="space-y-2">
										<span class="text-xs text-text-disabled">背景色</span>
										{#if bgColors.auto.length > 0}
											<div>
												<span class="text-[10px] text-text-disabled">自动</span>
												<div class="mt-1 flex h-6 w-full rounded overflow-hidden">
													{#each bgColors.auto as entry, i}
														<span class="relative h-full flex-1" class:rounded-l={i === 0} class:rounded-r={i === bgColors.auto.length - 1} style:background-color={entry.color}>
															{#if bgColors.active === entry.color}<span class="absolute inset-0 border-2 border-black"></span>{/if}
														</span>
													{/each}
												</div>
											</div>
										{/if}
										{#if bgColors.manual.length > 0}
											<div>
												<span class="text-[10px] text-text-disabled">手动</span>
												<div class="mt-1 flex h-6 w-full rounded overflow-hidden">
													{#each bgColors.manual as color, i}
														<button type="button" class="group/swatch relative h-full flex-1" class:rounded-l={i === 0} class:rounded-r={i === bgColors.manual.length - 1} style:background-color={color} onclick={() => removeManualColor(i)} aria-label={"移除 " + color}>
															<span class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/swatch:opacity-100">
																<svg class="h-3 w-3 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
															</span>
															{#if bgColors.active === color}<span class="absolute inset-0 border-2 border-black"></span>{/if}
														</button>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								{/if}
							{/if}
							<div>
								<label for="image-name" class="mb-1.5 block text-xs text-text-disabled">名称</label>
								<input id="image-name" type="text" bind:value={name} placeholder="图片名称" class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-primary" />
							</div>
							{#if error}<p class="text-xs text-error">{error}</p>{/if}
						</div>

					{:else if editing}
						<div class="space-y-4">
							<div class="group relative w-full cursor-pointer overflow-hidden rounded-md border border-border-primary" style="aspect-ratio: 1/1">
								{#if hasNewImage}
									<img src={imageUrl} alt="" class="h-full w-full object-cover" />
								{:else if editingImage}
									<img src={getR2Url(editingImage.file_key)} alt={editingImage.name} class="h-full w-full object-cover" />
								{/if}
								<div class="absolute inset-0 flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
									<button type="button" onclick={() => fileInput?.click()} class="flex flex-1 items-center justify-center bg-black/50 text-sm text-white transition-colors hover:bg-black/60">重新上传</button>
								</div>
							</div>
							<button type="button" onclick={openSampling} class="w-full rounded-md border border-border-primary py-2 text-sm text-text-primary transition-colors hover:bg-border">取色</button>
							<button type="button" onclick={recalculate} class="w-full rounded-md border border-border-primary py-2 text-sm text-text-primary transition-colors hover:bg-border">重新计算</button>
							{#if bgColors.auto.length > 0 || bgColors.manual.length > 0}
								<div class="space-y-2">
									<span class="text-xs text-text-disabled">背景色</span>
									{#if bgColors.auto.length > 0}
										<div>
											<span class="text-[10px] text-text-disabled">自动</span>
											<div class="mt-1 flex h-6 w-full rounded overflow-hidden">
												{#each bgColors.auto as entry, i}
													<span class="relative h-full flex-1" class:rounded-l={i === 0} class:rounded-r={i === bgColors.auto.length - 1} style:background-color={entry.color}>
														{#if bgColors.active === entry.color}<span class="absolute inset-0 border-2 border-black"></span>{/if}
													</span>
												{/each}
											</div>
										</div>
									{/if}
									{#if bgColors.manual.length > 0}
										<div>
											<span class="text-[10px] text-text-disabled">手动</span>
											<div class="mt-1 flex h-6 w-full rounded overflow-hidden">
												{#each bgColors.manual as color, i}
													<button type="button" class="group/swatch relative h-full flex-1" class:rounded-l={i === 0} class:rounded-r={i === bgColors.manual.length - 1} style:background-color={color} onclick={() => removeManualColor(i)} aria-label={"移除 " + color}>
														<span class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/swatch:opacity-100">
															<svg class="h-3 w-3 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
														</span>
														{#if bgColors.active === color}<span class="absolute inset-0 border-2 border-black"></span>{/if}
													</button>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
							{#if bgColors.auto.length > 0 || bgColors.manual.length > 0}
								<div>
									<label for="active-color" class="mb-1.5 block text-xs text-text-disabled">使用颜色</label>
									<Select.Root type="single" value={bgColors.active} onValueChange={(v) => { if (v) setActiveColor(v); }}>
										<Select.Trigger class="flex h-9 w-full items-center gap-2 rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary outline-none">
											{#if bgColors.active}
												<span class="inline-block h-4 w-4 shrink-0 rounded-sm border border-border-primary" style:background-color={bgColors.active}></span>
												<span class="truncate">{bgColors.auto.find((e) => e.color === bgColors.active) ? "自动" : "手动"} - {bgColors.active}</span>
											{:else}
												<span class="text-text-disabled">选择颜色</span>
											{/if}
											<svg class="ml-auto h-4 w-4 shrink-0 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9l6 6 6-6" /></svg>
										</Select.Trigger>
										<Select.Portal>
											<Select.Content class="z-50 max-h-60 overflow-hidden rounded-md border border-border-primary bg-fg shadow-lg" style="width: var(--bits-floating-anchor-width)">
												<Select.Viewport class="p-1">
													{#each bgColors.auto as entry}
														<Select.Item value={entry.color} label={"自动 - " + entry.color} class="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-text-primary outline-none data-highlighted:bg-bg-secondary-hover">
															<span class="inline-block h-4 w-4 rounded-sm border border-border-primary" style:background-color={entry.color}></span>
															自动 - {entry.color}
														</Select.Item>
													{/each}
													{#each bgColors.manual as color}
														<Select.Item value={color} label={"手动 - " + color} class="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-text-primary outline-none data-highlighted:bg-bg-secondary-hover">
															<span class="inline-block h-4 w-4 rounded-sm border border-border-primary" style:background-color={color}></span>
															手动 - {color}
														</Select.Item>
													{/each}
												</Select.Viewport>
											</Select.Content>
										</Select.Portal>
									</Select.Root>
								</div>
							{/if}
							<div>
								<label for="edit-image-name" class="mb-1.5 block text-xs text-text-disabled">名称</label>
								<input id="edit-image-name" type="text" bind:value={name} placeholder="图片名称" class="h-9 w-full rounded-md border border-border-primary bg-bg-secondary px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-primary" />
							</div>
							{#if error}<p class="text-xs text-error">{error}</p>{/if}
						</div>

					{:else if image}
						<div class="space-y-4">
							<div class="w-full overflow-hidden rounded-md border border-border-primary" style="aspect-ratio: 1/1">
								<img src={getR2Url(image.file_key)} alt={image.name} class="h-full w-full object-cover" />
							</div>
							<div><span class="text-xs text-text-disabled">名称</span><p class="mt-1 text-sm text-text-primary">{image.name}</p></div>
							{#if viewBg && (viewBg.auto.length > 0 || viewBg.manual.length > 0)}
								<div class="space-y-2">
									<span class="text-xs text-text-disabled">背景色</span>
									{#if viewBg.auto.length > 0}
										<div>
											<span class="text-[10px] text-text-disabled">自动</span>
											<div class="mt-1 flex h-6 w-full rounded overflow-hidden">
												{#each viewBg.auto as entry, i}
													<span class="relative h-full flex-1" class:rounded-l={i === 0} class:rounded-r={i === viewBg.auto.length - 1} style:background-color={entry.color}>
														{#if viewBg.active === entry.color}<span class="absolute inset-0 border-2 border-black"></span>{/if}
													</span>
												{/each}
											</div>
										</div>
									{/if}
									{#if viewBg.manual.length > 0}
										<div>
											<span class="text-[10px] text-text-disabled">手动</span>
											<div class="mt-1 flex h-6 w-full rounded overflow-hidden">
												{#each viewBg.manual as color, i}
													<span class="relative h-full flex-1" class:rounded-l={i === 0} class:rounded-r={i === viewBg.manual.length - 1} style:background-color={color}>
														{#if viewBg.active === color}<span class="absolute inset-0 border-2 border-black"></span>{/if}
													</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
							<div><span class="text-xs text-text-disabled">创建时间</span><p class="mt-1 text-xs text-text-disabled">{formatDate(image.created_at)}</p></div>
							<div><span class="text-xs text-text-disabled">更新时间</span><p class="mt-1 text-xs text-text-disabled">{formatDate(image.updated_at)}</p></div>
						</div>
					{/if}
				</div>
			</Scrollbar>

			<div class="flex min-h-18 items-center border-t border-border-primary px-4">
				{#if isAdding}
					<div class="flex w-full gap-2">
						<button type="button" onclick={close} class="h-8 flex-1 rounded-md border border-border-primary text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary">取消</button>
						<button type="button" onclick={handleCreate} disabled={!hasNewImage || uploading} class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-cf text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
							{#if uploading}<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{/if}
							创建
						</button>
					</div>
				{:else if editing}
					<div class="flex w-full gap-2">
						<button type="button" onclick={cancelEdit} class="h-8 flex-1 rounded-md border border-border-primary text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary">取消</button>
						<button type="button" onclick={handleSave} disabled={uploading} class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-cf text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
							{#if uploading}<svg class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{/if}
							保存
						</button>
					</div>
				{:else if image}
					<div class="flex w-full gap-2">
						<button type="button" onclick={startEdit} class="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-primary text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary">
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
							编辑
						</button>
						<button type="button" onclick={handleDelete} class="flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-error text-sm text-error transition-colors hover:bg-error hover:text-white">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
							删除
						</button>
					</div>
				{/if}
			</div>
		</div>
		<input bind:this={fileInput} type="file" accept="image/*" class="hidden" onchange={handleFileSelect} />
	</aside>
{/if}

{#if cropOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
		<div class="flex min-h-0 w-full max-w-2xl flex-1 items-center justify-center px-6 py-4">
			<div class="relative aspect-square w-full overflow-hidden bg-black">
				<Cropper image={stagingUrl} bind:crop bind:zoom aspect={1} oncropcomplete={handleCropComplete} />
			</div>
		</div>
		<div class="flex w-full max-w-2xl gap-3 px-6 pb-6">
			<button type="button" onclick={cancelCrop} class="h-9 flex-1 rounded-md border border-white/20 text-sm text-white/80 transition-colors hover:bg-white/10">取消</button>
			<button type="button" onclick={confirmCrop} class="h-9 flex-1 rounded-md bg-cf text-sm font-medium text-white transition-opacity hover:opacity-90">确认</button>
		</div>
	</div>
{/if}

{#if samplingOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onclick={closeSampling} onkeydown={(e) => e.key === 'Escape' && closeSampling()}>
		<div class="flex w-full max-w-2xl flex-col bg-fg shadow-2xl"
			onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between border-b border-border-primary px-4 py-3">
				<h3 class="text-sm font-semibold text-text-primary">取色</h3>
				<button onclick={closeSampling} class="flex h-7 w-7 items-center justify-center rounded text-text-disabled transition-colors hover:bg-border hover:text-text-primary" aria-label="关闭">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
				</button>
			</div>
			<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
			<div class="relative aspect-square w-full cursor-crosshair bg-black" onmousemove={handleSamplingMouseMove} onclick={handleSamplingClick} onkeydown={() => {}} onmouseleave={() => { lensVisible = false; hoveredColor = null; }}>
				{#if hasNewImage}
					<img src={imageUrl} alt="" class="h-full w-full object-contain" />
				{:else if image}
					<img src={getR2Url(image.file_key)} alt={image.name} class="h-full w-full object-contain" />
				{/if}
				{#if lensVisible}
					<div class="pointer-events-none absolute" style:left="{lensX > containerWidth - 180 ? lensX - 168 : lensX + 16}px" style:top="{lensY > containerHeight - 180 ? lensY - 168 : lensY + 16}px">
						<div class="flex flex-col">
							<div class="magnifier">
								<canvas bind:this={magnifierCanvas} width="152" height="152" class="h-full w-full"></canvas>
								<div class="magnifier-crosshair-v"></div>
								<div class="magnifier-crosshair-h"></div>
								<div class="magnifier-center"></div>
							</div>
							{#if hoveredColor}
								<div class="flex items-center gap-2 bg-black/85 px-2.5 py-1.5">
									<span class="inline-block h-3.5 w-3.5 rounded-sm border border-white/20" style:background-color={hoveredColor}></span>
									<span class="text-xs font-mono text-white">{hoveredColor}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
			{#if bgColors.manual.length > 0}
				<div class="border-t border-border-primary p-4">
					<div class="flex h-8 w-full rounded overflow-hidden">
						{#each bgColors.manual as color, i}
							<span class="h-full flex-1" class:rounded-l={i === 0} class:rounded-r={i === bgColors.manual.length - 1} style:background-color={color}></span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.magnifier { position: relative; width: 152px; height: 152px; overflow: hidden; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
	.magnifier-crosshair-v, .magnifier-crosshair-h { position: absolute; pointer-events: none; }
	.magnifier-crosshair-v { left: 72px; top: 0; width: 8px; height: 100%; background: rgba(255,255,255,0.35); }
	.magnifier-crosshair-h { top: 72px; left: 0; height: 8px; width: 100%; background: rgba(255,255,255,0.35); }
	.magnifier-center { position: absolute; left: 76px; top: 76px; width: 8px; height: 8px; transform: translate(-50%,-50%); border: 1.5px solid rgba(255,255,255,0.8); pointer-events: none; }
</style>
