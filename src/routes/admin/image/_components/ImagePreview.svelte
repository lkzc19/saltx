<script lang="ts">
	import type { Image } from '$lib/types/music';
	import { getOriginalUrl } from '$lib/utils/music';

	let { image, onclose, ondelete }: { image: Image | null; onclose: () => void; ondelete: (id: string) => void } = $props();
</script>

{#if image}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onclick={onclose} onkeydown={(e) => e.key === 'Escape' && onclose()}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="relative max-h-[90vh] max-w-[90vw]" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
			<button
				onclick={onclose}
				aria-label="关闭"
				class="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded text-text-primary transition-colors hover:text-text-primary"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<img
				src={getOriginalUrl(image.file_key)}
				alt={image.name}
				class="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
			/>

			<div class="mt-4 flex items-center justify-between">
				<div>
					<p class="text-sm text-text-primary">{image.name}</p>
					<p class="text-xs text-text-primary">{image.extension.toUpperCase()} · {image.aspect_ratio}</p>
					{#if image.background_color}
						<div class="mt-2 flex items-center gap-2 text-xs text-text-primary">
							<span
								class="inline-block h-3 w-3 rounded-full border border-white/15"
								style:background-color={image.background_color}
							></span>
							<span>{image.background_color}</span>
						</div>
					{/if}
				</div>
				<button
					onclick={() => ondelete(image.id)}
					class="flex h-9 items-center gap-2 rounded-md border border-error px-4 text-sm text-error transition-colors hover:bg-error hover:text-white"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					删除
				</button>
			</div>
		</div>
	</div>
{/if}
