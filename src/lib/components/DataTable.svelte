<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	let {
		columns,
		data,
		key,
		row,
		emptyText = '暂无数据'
	}: {
		columns: { header: string; width?: string }[];
		data: T[];
		key: (item: T) => string;
		row: Snippet<[T]>;
		emptyText?: string;
	} = $props();
</script>

<div class="flex-1 overflow-auto">
	<table class="w-full border-t border-l border-border-primary text-sm">
		<thead>
			<tr class="h-12 bg-fg text-left text-text-primary">
				{#each columns as col}
					<th
						class="border-b border-r border-border-primary px-4"
						style={col.width ? `width:${col.width}` : ''}
					>
						{col.header}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data as item (key(item))}
				<tr class="h-12 bg-fg transition-colors hover:bg-bg-secondary-hover">
					{@render row(item)}
				</tr>
			{:else}
				<tr>
					<td colspan={columns.length} class="px-4 py-12 text-center text-text-disabled">{emptyText}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
