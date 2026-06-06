<script lang="ts">
	import type { Image } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';
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

	const columns = [
		{ header: '', width: '2.5rem' },
		{ header: '名称' },
		{ header: '', width: '3rem', headerClass: 'px-0 text-center' }
	];
</script>

<DataTable
	{columns}
	data={items}
	key={(item) => item.id}
>
	{#snippet header({ col, index })}
		{#if index === 2}
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
			<div class="h-8 w-8 overflow-hidden rounded border border-border-primary bg-fg">
				<img src={getR2Url(item.file_key)} alt={item.name} class="h-full w-full object-cover" />
			</div>
		</td>
		<td class="cursor-pointer border-b border-r border-border-primary px-4 align-middle text-text-primary" onclick={() => onselect(item)}>
			{item.name}
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
