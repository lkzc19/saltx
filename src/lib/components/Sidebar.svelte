<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { playerState, requestTogglePlay } from '$lib/stores/admin.svelte';

	let { collapsed = $bindable(false) } = $props();

	const navItems: { icon: string; label: string; href: '/admin/music' | '/admin/image' }[] = [
		{ icon: 'music', label: '音乐管理', href: '/admin/music' },
		{ icon: 'image', label: '图片管理', href: '/admin/image' }
	];

	function navHref(href: '/admin/music' | '/admin/image') {
		switch (href) {
			case '/admin/music':
				return resolve('/admin/music', {});
			case '/admin/image':
				return resolve('/admin/image', {});
		}
	}

	function isActive(href: string): boolean {
		return (page.url.pathname as string).startsWith(href);
	}

	let track = $derived($playerState.currentTrack);
	let playing = $derived($playerState.playing);
</script>

<aside
	class="fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-border bg-bg-card transition-all duration-200"
	class:w-16={collapsed}
	class:w-56={!collapsed}
>
	<!-- 顶部 Logo / 折叠按钮 -->
	<div class="flex h-14 items-center justify-between border-b border-border px-4">
		{#if !collapsed}
			<span class="text-sm font-semibold text-primary">SALT X</span>
		{/if}
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:bg-border hover:text-text"
			aria-label="切换侧边栏"
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

	<!-- 导航 -->
	<nav class="flex-1 overflow-y-auto py-3">
		{#each navItems as item (item.href)}
			<a
				href={navHref(item.href)}
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

	<!-- 底部播放区 -->
	<div class="border-t border-border">
		{#if collapsed}
			<!-- 收起：封面 + 播放/暂停 overlay -->
			<div class="flex h-16 items-center justify-center">
				{#if track}
					<button
						onclick={requestTogglePlay}
						class="group relative h-11 w-11 overflow-hidden rounded-lg border border-border"
						aria-label={playing ? '暂停' : '播放'}
					>
						{#if track.cover_file_key}
							<img src={`/files/${track.cover_file_key}`} alt="" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-bg-primary text-text-disabled">
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
								</svg>
							</div>
						{/if}
						<div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
							{#if playing}
								<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
								</svg>
							{:else}
								<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
									<path d="M8 5v14l11-7z" />
								</svg>
							{/if}
						</div>
					</button>
				{:else}
					<div class="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-bg-primary text-text-disabled">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
						</svg>
					</div>
				{/if}
			</div>
		{:else}
			<!-- 展开：封面 + 歌名/歌手 + 播放按钮 -->
			<div class="flex h-16 items-center gap-2.5 px-3">
				<div class="h-10 w-10 shrink-0 overflow-hidden rounded border border-border bg-bg-primary">
					{#if track?.cover_file_key}
						<img src={`/files/${track.cover_file_key}`} alt="" class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center text-text-disabled">
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
							</svg>
						</div>
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					{#if track}
						<p class="truncate text-xs font-medium text-text">{track.name}</p>
						<p class="truncate text-xs text-text-muted">{track.artist}</p>
					{:else}
						<p class="text-xs text-text-disabled">暂无播放</p>
					{/if}
				</div>
				<button
					onclick={track ? requestTogglePlay : undefined}
					disabled={!track}
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors"
					class:hover:text-primary={!!track}
					class:opacity-30={!track}
					aria-label={playing ? '暂停' : '播放'}
				>
					{#if playing}
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
						</svg>
					{:else}
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z" />
						</svg>
					{/if}
				</button>
			</div>
		{/if}
	</div>
</aside>
