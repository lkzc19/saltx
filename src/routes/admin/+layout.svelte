<script lang="ts">
	import AdminHeader from '$lib/components/AdminHeader.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import PlayerBar from '$lib/components/PlayerBar.svelte';
	import { adminState } from '$lib/stores/admin.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen flex-col overflow-hidden bg-bg-primary">
	<AdminHeader />
	<div class="flex flex-1 overflow-hidden">
		<Sidebar bind:collapsed={adminState.sidebarCollapsed} />
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>
	</div>
</div>

<PlayerBar />
