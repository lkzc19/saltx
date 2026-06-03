<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { adminState, playerState, requestTogglePlay } from '$lib/stores/admin.svelte';
	import { initPlayer } from '$lib/utils/player';
	import favicon from '$lib/assets/favicon.svg';
	import DashboardIcon from '@iconify-svelte/lucide/layout-dashboard';
	import MusicNoteIcon from '@iconify-svelte/lucide/music';
	import ImageIcon from '@iconify-svelte/lucide/image';
	import PlayIcon from '@iconify-svelte/lucide/play';
	import PauseIcon from '@iconify-svelte/lucide/pause';

	let { children } = $props();

	const navItems: { icon: typeof DashboardIcon; label: string; href: '/admin/dashboard' | '/admin/music' | '/admin/image' }[] = [
		{ icon: DashboardIcon, label: '仪表盘', href: '/admin/dashboard' },
		{ icon: MusicNoteIcon, label: '音乐管理', href: '/admin/music' },
		{ icon: ImageIcon, label: '图片管理', href: '/admin/image' }
	];

	function navHref(href: '/admin/dashboard' | '/admin/music' | '/admin/image') {
		switch (href) {
			case '/admin/dashboard':
				return resolve('/admin/dashboard', {});
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

	onMount(initPlayer);
</script>

<div class="flex h-screen flex-col overflow-hidden bg-bg-primary">
	<!-- Header -->
	<header class="flex shrink-0 items-center border-b border-border-primary bg-bg-primary">
		<div
			class="flex h-full items-center gap-3 border-r border-border-primary py-4 pl-7 pr-4 transition-all duration-200"
			class:w-16={adminState.sidebarCollapsed}
			class:w-62={!adminState.sidebarCollapsed}
		>
			<img src={favicon} alt="Salt X" class="h-10 w-10 shrink-0" />
			{#if !adminState.sidebarCollapsed}
				<span class="text-2xl font-semibold text-text-primary">盐</span>
			{/if}
		</div>
	</header>

	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		<aside
			class="flex h-full flex-col border-r border-border-primary bg-bg-primary p-4 transition-all duration-200 lg:w-62"
			class:w-16={adminState.sidebarCollapsed}
			class:w-full={!adminState.sidebarCollapsed}
		>
			<!-- 导航 -->
			<nav class="flex-1 overflow-y-auto">
				{#each navItems as item (item.href)}
					<a
						href={navHref(item.href)}
						class="mb-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
						style={isActive(item.href) ? 'background: var(--color-bg-primary-hover)' : ''}
						class:text-primary={isActive(item.href)}
						class:text-text-primary={!isActive(item.href)}
						class:hover:bg-bg-primary-hover={!isActive(item.href)}
						class:hover:text-text-primary={!isActive(item.href)}
						class:justify-center={adminState.sidebarCollapsed}
					>
						<item.icon class="h-4 w-4 shrink-0" />
						{#if !adminState.sidebarCollapsed}
							<span>{item.label}</span>
						{/if}
					</a>
				{/each}
			</nav>

			<!-- 底部播放区 -->
			<div class="-mb-4 -mx-4 border-t border-border-primary">
				{#if adminState.sidebarCollapsed}
					<div class="flex h-[72px] items-center justify-center">
						{#if track}
							<button
								onclick={requestTogglePlay}
								class="group relative h-11 w-11 overflow-hidden rounded-lg border border-border-primary"
								aria-label={playing ? '暂停' : '播放'}
							>
								{#if track.cover_file_key}
									<img src={`/files/${track.cover_file_key}`} alt="" class="h-full w-full object-cover" />
								{:else}
									<div class="flex h-full w-full items-center justify-center bg-bg-primary text-text-disabled">
										<MusicNoteIcon class="h-4 w-4" />
									</div>
								{/if}
								<div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
									{#if playing}
										<PauseIcon class="h-4 w-4 text-white" />
									{:else}
										<PlayIcon class="h-4 w-4 text-white" />
									{/if}
								</div>
							</button>
						{:else}
							<div class="flex h-11 w-11 items-center justify-center rounded-lg border border-border-primary bg-bg-primary text-text-disabled">
								<MusicNoteIcon class="h-4 w-4" />
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex h-[72px] items-center gap-2.5 px-4">
						<div class="h-10 w-10 shrink-0 overflow-hidden rounded border border-border-primary bg-bg-primary">
							{#if track?.cover_file_key}
								<img src={`/files/${track.cover_file_key}`} alt="" class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center text-text-disabled">
									<MusicNoteIcon class="h-4 w-4" />
								</div>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							{#if track}
								<p class="truncate text-xs font-medium text-text-primary">{track.name}</p>
								<p class="truncate text-xs text-text-primary">{track.artist}</p>
							{:else}
								<p class="text-xs text-text-disabled">暂无播放</p>
							{/if}
						</div>
						<button
							onclick={track ? requestTogglePlay : undefined}
							disabled={!track}
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-primary transition-colors"
							class:hover:text-primary={!!track}
							class:opacity-30={!track}
							aria-label={playing ? '暂停' : '播放'}
						>
							{#if playing}
								<PauseIcon class="h-4 w-4" />
							{:else}
								<PlayIcon class="h-4 w-4" />
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</aside>

		<main class="flex-1 overflow-auto bg-bg-secondary">
			{@render children()}
		</main>
	</div>
</div>
