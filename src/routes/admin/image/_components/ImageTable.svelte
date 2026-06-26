<script lang="ts">
	import type { Image } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';
	import { parseBgColors, type BgColors } from "$lib/utils/image";
	import DataTable from '$lib/components/DataTable.svelte';
	import { Plus, Trash } from '@lucide/svelte';

	let {
		items,
		selectedId,
		onselect,
		ondelete,
		onadd
	}: {
		items: Image[];
		selectedId: string | null;
		onselect: (item: Image) => void;
		ondelete: (id: string) => void;
		onadd: () => void;
	} = $props();

	const parseBg = parseBgColors;

	function allColors(bg: BgColors | null): string[] {
		if (!bg) return [];
		return [...bg.auto.map((c) => c.color), ...bg.manual];
	}


	const columns = [
		{ header: '', width: '2.5rem' },
		{ header: '名称' },
		{ header: '背景色' },
		{ header: '', width: '3rem', headerClass: 'px-0 text-center' }
	];
</script>

<DataTable
	{columns}
	data={items}
	key={(item) => item.id}
>
	{#snippet header({ col, index })}
		{#if index === 3}
			<button
				onclick={onadd}
				class="flex h-6 w-6 items-center justify-center rounded bg-cf text-white transition-opacity hover:opacity-90"
				aria-label="上传图片"
			>
				<Plus class="h-3.5 w-3.5" />
			</button>
		{:else}
			{col.header}
		{/if}
	{/snippet}
	{#snippet row(item)}
		<td class="border-b border-r border-border-primary px-2 align-middle" onclick={() => onselect(item)}>
			<div class="flex items-center justify-center">
				<div class="overflow-hidden rounded border border-border-primary bg-fg" style:aspect-ratio={item.aspect_ratio === '16:9' ? '16/9' : '1/1'} style:width={item.aspect_ratio === '16:9' ? '2.5rem' : '2rem'} style:height={item.aspect_ratio === '16:9' ? 'auto' : '2rem'}>
					<img src={getR2Url(item.file_key)} alt={item.name} class="h-full w-full object-cover" />
				</div>
			</div>
		</td>
		<td class="cursor-pointer border-b border-r border-border-primary px-4 align-middle text-text-primary" onclick={() => onselect(item)}>
			{item.name}
		</td>
		<td class="border-b border-r border-border-primary px-4 align-middle">
			{#if allColors(parseBg(item.background_colors)).length > 0}
				{@const bg = parseBg(item.background_colors)}
				{@const colors = allColors(bg)}
				<div class="relative flex h-8 w-full rounded">
					{#each colors as color, i (color)}
						<span
							class="group/swatch relative h-full flex-1"
							class:rounded-l={i === 0}
							class:rounded-r={i === colors.length - 1}
							style:background-color={color}
						>
							{#if bg?.active === color}
								<span class="absolute inset-0 border-2 border-black" class:rounded-l={i === 0} class:rounded-r={i === colors.length - 1}></span>
							{/if}
							<span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover/swatch:opacity-100">
								{color}
							</span>
						</span>
					{/each}
				</div>
			{/if}
		</td>
		<td class="border-b border-r border-border-primary bg-fg p-0 text-center">
			<button
				onclick={(e) => {
					e.stopPropagation();
					ondelete(item.id);
				}}
				class="inline-flex h-6 w-6 items-center justify-center rounded bg-fg text-text-primary transition-colors hover:bg-bg-secondary-hover hover:text-error"
				aria-label="删除 {item.name}"
			>
				<Trash class="h-3.5 w-3.5" />
			</button>
		</td>
	{/snippet}
</DataTable>
