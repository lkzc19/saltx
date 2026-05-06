<script lang="ts">
	import { page } from '$app/state';

	let { collapsed = $bindable(false) } = $props();

	const navItems = [
		{ icon: 'music', label: '音乐管理', href: '/admin/music' },
		{ icon: 'image', label: '图片管理', href: '/admin/image' }
	];

	function isActive(href: string): boolean {
		const pathname: string = page.url.pathname;
		return pathname.startsWith(href);
	}
</script>

<aside
	class="fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-border bg-bg-card transition-all duration-200"
	class:w-16={collapsed}
	class:w-56={!collapsed}
>
	<div class="flex h-14 items-center justify-between border-b border-border px-4">
		{#if !collapsed}
			<span class="text-sm font-semibold text-primary">SALT X</span>
		{/if}
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:bg-border hover:text-text"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if collapsed}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
				{/if}
			</svg>
		</button>
	</div>

	<nav class="flex-1 overflow-y-auto py-3">
		{#each navItems as item}
			<a
				href={item.href}
				class="mx-2 mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
				style={isActive(item.href) ? 'background: var(--highlight-bg)' : ''}
				class:text-primary={isActive(item.href)}
				class:text-text-muted={!isActive(item.href)}
				class:hover:bg-border={!isActive(item.href)}
				class:hover:text-text={!isActive(item.href)}
				class:justify-center={collapsed}
				class:px-2={collapsed}
			>
				{#if item.icon === 'music'}
					<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
					</svg>
				{:else if item.icon === 'image'}
					<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				{/if}
				{#if !collapsed}
					<span>{item.label}</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>