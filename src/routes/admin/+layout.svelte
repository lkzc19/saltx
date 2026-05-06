<script lang="ts">
	import { setContext } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import PlayerBar from '$lib/components/PlayerBar.svelte';
	import { adminState, playerState } from '$lib/stores/admin.svelte';

	let { data, children } = $props();

	setContext('r2PublicUrl', data.r2PublicUrl);
</script>

<div class="flex h-screen overflow-hidden bg-bg-primary">
	<Sidebar bind:collapsed={adminState.sidebarCollapsed} />
	<main
		class="flex-1 overflow-auto transition-all duration-200"
		class:ml-16={adminState.sidebarCollapsed}
		class:ml-56={!adminState.sidebarCollapsed}
		class:pb-16={$playerState.currentTrack !== null}
	>
		{@render children()}
	</main>
</div>

<PlayerBar r2PublicUrl={data.r2PublicUrl} />