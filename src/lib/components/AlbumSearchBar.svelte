<script lang="ts">
	let {
		filters = { name: '', artist: '' },
		onsearch,
		oncreate
	}: {
		filters: { name: string; artist: string };
		onsearch: (filters: { name: string; artist: string }) => void;
		oncreate: () => void;
	} = $props();

	let name = $state('');
	let artist = $state('');

	$effect(() => {
		name = filters.name;
		artist = filters.artist;
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		onsearch({ name, artist });
	}
</script>

<form onsubmit={handleSubmit} class="mb-4 flex items-center gap-3">
	<div class="flex flex-1 items-center gap-2">
		<div class="relative">
			<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				bind:value={name}
				placeholder="专辑名称"
				class="h-9 w-40 rounded-md border border-border bg-bg-card pl-9 pr-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
			/>
		</div>
		<div class="relative">
			<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
			</svg>
			<input
				type="text"
				bind:value={artist}
				placeholder="艺术家"
				class="h-9 w-40 rounded-md border border-border bg-bg-card pl-9 pr-3 text-sm text-text placeholder:text-text-disabled outline-none transition-colors focus:border-primary"
			/>
		</div>
		<button
			type="submit"
			class="h-9 rounded-md border border-border bg-bg-card px-4 text-sm text-text-muted transition-colors hover:border-primary hover:text-primary"
		>
			搜索
		</button>
	</div>
	<button
		type="button"
		onclick={oncreate}
		class="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
		新增专辑
	</button>
</form>
