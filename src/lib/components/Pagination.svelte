<script lang="ts">
	let {
		page,
		pageSize,
		total,
		totalPages,
		onchange
	}: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
		onchange: (page: number, pageSize: number) => void;
	} = $props();

	function goTo(p: number) {
		if (p >= 1 && p <= totalPages && p !== page) {
			onchange(p, pageSize);
		}
	}

	const pageSizes = [10, 20, 50, 100];

	let visiblePages = $derived.by(() => {
		const pages: (number | '...')[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
			return pages;
		}
		pages.push(1);
		if (page > 3) pages.push('...');
		for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
			pages.push(i);
		}
		if (page < totalPages - 2) pages.push('...');
		pages.push(totalPages);
		return pages;
	});
</script>

<div class="text-sm flex items-center justify-between">
	<span class="text-text-disabled">共 {total} 条</span>
	<div class="flex items-center gap-1">
		<button
			onclick={() => goTo(1)}
			disabled={page <= 1}
			aria-label="第一页"
			class="flex h-8 w-8 items-center justify-center rounded text-text-primary transition-colors hover:bg-border hover:text-text-primary disabled:opacity-30"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
		</button>
		<button
			onclick={() => goTo(page - 1)}
			disabled={page <= 1}
			aria-label="上一页"
			class="flex h-8 w-8 items-center justify-center rounded text-text-primary transition-colors hover:bg-border hover:text-text-primary disabled:opacity-30"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</button>
		{#each visiblePages as p (p)}
			{#if p === '...'}
				<span class="flex h-8 w-8 items-center justify-center text-text-disabled">…</span>
			{:else}
				<button
					onclick={() => goTo(p as number)}
					aria-label="第 {p} 页"
					class="flex h-8 w-8 items-center justify-center rounded text-sm transition-colors"
					class:bg-primary={p === page}
					class:text-bg-primary={p === page}
					class:text-text-primary={p !== page}
					class:hover:bg-border={p !== page}
					class:hover:text-text-primary={p !== page}
				>
					{p}
				</button>
			{/if}
		{/each}
		<button
			onclick={() => goTo(page + 1)}
			disabled={page >= totalPages}
			aria-label="下一页"
			class="flex h-8 w-8 items-center justify-center rounded text-text-primary transition-colors hover:bg-border hover:text-text-primary disabled:opacity-30"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
		</button>
		<button
			onclick={() => goTo(totalPages)}
			disabled={page >= totalPages}
			aria-label="最后一页"
			class="flex h-8 w-8 items-center justify-center rounded text-text-primary transition-colors hover:bg-border hover:text-text-primary disabled:opacity-30"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
		</button>
	</div>
	<select
		value={String(pageSize)}
		onchange={(e) => onchange(1, Number((e.target as HTMLSelectElement).value))}
		class="h-8 rounded-md border border-border-primary bg-fg px-2 text-xs text-text-primary outline-none"
	>
		{#each pageSizes as ps (ps)}
			<option value={String(ps)}>{ps} 条/页</option>
		{/each}
	</select>
</div>
