<script lang="ts">
	import { getR2Url } from '$lib/utils/music';
	import type { Image } from '$lib/types/music';

	let {
		open = $bindable(false),
		onselect
	}: {
		open: boolean;
		onselect: (image: Image) => void;
	} = $props();

	let images = $state<Image[]>([]);
	let loading = $state(false);
	let searchInput = $state('');

	async function fetchImages(name?: string) {
		loading = true;
		try {
			const qs = name ? `pageSize=50&name=${encodeURIComponent(name)}` : 'pageSize=50';
			const res = await fetch(`/api/admin/image/list?${qs}`);
			if (res.ok) {
				const data = (await res.json()) as { items: Image[] };
				images = data.items;
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open) {
			searchInput = '';
			fetchImages();
		}
	});

	function handleSearch() {
		fetchImages(searchInput || undefined);
	}

	function handleSelect(img: Image) {
		onselect(img);
		open = false;
	}

	function close() {
		open = false;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex h-[70vh] w-full max-w-2xl flex-col rounded-lg border border-border-primary bg-fg shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border-primary px-5 py-4">
				<h2 class="text-base font-semibold text-text-primary">选择封面</h2>
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

			<!-- Search -->
			<div class="flex gap-2 px-5 py-3">
				<input
					type="text"
					bind:value={searchInput}
					placeholder="搜索图片名称"
					onkeydown={(e) => e.key === 'Enter' && handleSearch()}
					class="h-8 flex-1 rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
				/>
				<button
					onclick={handleSearch}
					class="h-8 rounded-md border border-border-primary px-3 text-sm text-text-primary transition-colors hover:bg-border hover:text-text-primary"
				>
					搜索
				</button>
			</div>

			<!-- Grid -->
			<div class="flex-1 overflow-auto px-5 pb-5">
				{#if loading}
					<div class="flex h-32 items-center justify-center text-text-disabled">加载中...</div>
				{:else}
					<div class="grid grid-cols-3 gap-3">
						{#each images as img (img.id)}
							<button
								type="button"
								class="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border-primary bg-fg transition-all hover:border-primary"
								onclick={() => handleSelect(img)}
							>
								<img
									src={getR2Url(img.file_key)}
									alt={img.name}
									class="max-h-full max-w-full object-contain"
								/>
								<div class="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
									<p class="truncate text-xs text-white">{img.name}</p>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
