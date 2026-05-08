<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import PlayerBar from '$lib/components/PlayerBar.svelte';
	import { adminState } from '$lib/stores/admin.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen overflow-hidden bg-bg-primary">
	<Sidebar bind:collapsed={adminState.sidebarCollapsed} />
	<main
		class="flex-1 overflow-auto transition-all duration-200"
		class:ml-16={adminState.sidebarCollapsed}
		class:ml-56={!adminState.sidebarCollapsed}
	>
		{@render children()}
	</main>
</div>

<PlayerBar />
