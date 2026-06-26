<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	let {
		columns,
		data,
		key,
		row,
		header
	}: {
		columns: { header: string; width?: string; headerClass?: string; class?: string }[];
		data: T[];
		key: (item: T) => string;
		row: Snippet<[T]>;
		header?: Snippet<[{ col: { header: string; width?: string; headerClass?: string; class?: string }; index: number }]>;
	} = $props();
</script>

<div class="flex-1 overflow-auto">
	<table class="w-full border-t border-l border-border-primary text-sm">
		<thead>
			<tr class="h-12 bg-fg text-left text-text-primary">
				{#each columns as col, i (i)}
					<th
						class="border-b border-r border-border-primary px-4 {col.headerClass ?? ''}"
						style={col.width ? `width:${col.width}` : ''}
					>
						{#if header}
							{@render header({ col, index: i })}
						{:else}
							{col.header}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each data as item (key(item))}
				<tr class="h-12 bg-fg transition-colors hover:bg-bg-secondary-hover">
					{@render row(item)}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
