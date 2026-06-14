<script lang="ts">
	import type { Announcement } from '$lib/types/announcement';
	import { getR2Url } from '$lib/utils/music';
	import DataTable from '$lib/components/DataTable.svelte';
	import { Plus, Trash } from '@lucide/svelte';

	let {
		items,
		selectedId,
		onselect,
		onadd,
		ondelete,
		ontogglepin
	}: {
		items: Announcement[];
		selectedId: string | null;
		onselect: (item: Announcement) => void;
		onadd: () => void;
		ondelete: (id: string) => void;
		ontogglepin: (id: string) => void;
	} = $props();

	const columns = [
		{ header: '封面', width: '8rem', headerClass: 'text-center' },
		{ header: '标题' },
		{ header: '内容' },
		{ header: '常驻', width: '5rem', headerClass: 'text-center' },
		{ header: '', width: '3rem', headerClass: 'px-0 text-center' }
	];
</script>

<DataTable
	{columns}
	data={items}
	key={(item) => item.id}
>
	{#snippet header({ col, index })}
		{#if index === 4}
			<button
				onclick={onadd}
				class="flex h-6 w-6 items-center justify-center rounded bg-cf text-white transition-opacity hover:opacity-90"
				aria-label="添加公告"
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
				<div class="h-8 w-14 overflow-hidden rounded border border-border-primary bg-fg">
					{#if item.cover_file_key}
						<img src={getR2Url(item.cover_file_key)} alt="" class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center text-text-disabled">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
							</svg>
						</div>
					{/if}
				</div>
			</div>
		</td>
		<td class="cursor-pointer border-b border-r border-border-primary px-4 align-middle text-text-primary" onclick={() => onselect(item)}>
			{item.title}
		</td>
		<td class="cursor-pointer border-b border-r border-border-primary px-4 align-middle text-text-primary" onclick={() => onselect(item)}>
			<span class="line-clamp-1">{item.content ?? ''}</span>
		</td>
		<td class="border-b border-r border-border-primary px-4 align-middle text-center">
			<button
				type="button"
				role="switch"
				aria-checked={item.is_pinned === 'true'}
				aria-label="切换常驻状态"
				onclick={(e) => {
					e.stopPropagation();
					ontogglepin(item.id);
				}}
				class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
				class:bg-cf={item.is_pinned === 'true'}
				class:bg-border-primary={item.is_pinned !== 'true'}
			>
				<span
					class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
					class:translate-x-[18px]={item.is_pinned === 'true'}
					class:translate-x-[3px]={item.is_pinned !== 'true'}
				></span>
			</button>
		</td>
		<td class="border-b border-r border-border-primary bg-fg p-0 text-center">
			<button
				onclick={(e) => {
					e.stopPropagation();
					ondelete(item.id);
				}}
				class="inline-flex h-6 w-6 items-center justify-center rounded bg-fg text-text-primary transition-colors hover:bg-bg-secondary-hover hover:text-error"
				aria-label="删除 {item.title}"
			>
				<Trash class="h-3.5 w-3.5" />
			</button>
		</td>
	{/snippet}
</DataTable>
