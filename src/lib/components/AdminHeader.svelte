<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { adminState } from '$lib/stores/admin.svelte';
</script>

<header class="flex h-14 shrink-0 items-center border-b border-border bg-bg-card">
	<div
		class="flex h-full items-center gap-2.5 border-r border-border px-4 transition-all duration-200"
		class:w-16={adminState.sidebarCollapsed}
		class:w-56={!adminState.sidebarCollapsed}
	>
		<img src={favicon} alt="Salt X" class="h-7 w-7 shrink-0" />
		{#if !adminState.sidebarCollapsed}
			<span class="text-base font-semibold text-text">盐</span>
		{/if}
	</div>
</header>
