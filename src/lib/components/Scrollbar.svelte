<script lang="ts">
	import { OverlayScrollbarsComponent } from 'overlayscrollbars-svelte';
	import type { Snippet } from 'svelte';

	let {
		class: className = '',
		children
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<OverlayScrollbarsComponent
	class={className}
	options={{
		scrollbars: {
			autoHide: 'leave',
			autoHideDelay: 300
		}
	}}
>
	{@render children()}
</OverlayScrollbarsComponent>
