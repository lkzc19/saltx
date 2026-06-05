<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { adminState, playerState, requestTogglePlay, requestPlayPrevious, requestPlayNext, requestSeek, loadTracks } from '$lib/stores/admin.svelte';
	import { initPlayer, destroyPlayer } from '$lib/utils/player';
	import favicon from '$lib/assets/favicon.svg';
	import { LayoutDashboard, Music, Image, Play, Pause, SkipBack, SkipForward } from '@lucide/svelte';

	let { children } = $props();

	const navItems: { icon: typeof LayoutDashboard; label: string; href: '/admin/dashboard' | '/admin/music' | '/admin/image' }[] = [
		{ icon: LayoutDashboard, label: '仪表盘', href: '/admin/dashboard' },
		{ icon: Music, label: '音乐管理', href: '/admin/music' },
		{ icon: Image, label: '图片管理', href: '/admin/image' }
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
	let hasTracks = $derived($playerState.tracks.length > 0);
	let currentTime = $derived($playerState.currentTime);
	let duration = $derived($playerState.duration);
	let progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

	function handleProgressClick(e: MouseEvent & { currentTarget: HTMLDivElement }) {
		if (!duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		requestSeek(ratio * duration);
	}

	onMount(() => {
		initPlayer();
		// 加载歌曲列表供 sidebar 播放
		fetch('/api/music')
			.then((res) => res.ok ? res.json() : Promise.reject(new Error('加载失败')))
			.then((data) => loadTracks((data as { items: import('$lib/types/music').Music[] }).items))
			.catch((e) => console.error('加载歌曲列表失败:', e));

		return destroyPlayer;
	});
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
			class="flex h-full flex-col border-r border-border-primary bg-bg-primary transition-all duration-200 lg:w-62"
			class:w-16={adminState.sidebarCollapsed}
			class:w-full={!adminState.sidebarCollapsed}
		>
			<!-- 导航 -->
			<nav class="flex-1 overflow-y-auto p-4">
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
			{#if adminState.sidebarCollapsed}
				<div class="relative flex min-h-18 items-center justify-center px-4 pt-px">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="absolute inset-x-0 top-0 h-px cursor-pointer bg-border-primary"
						onclick={handleProgressClick}
						onkeydown={() => {}}
						role="slider"
						aria-label="播放进度"
						aria-valuenow={Math.round(progress)}
						aria-valuemin={0}
						aria-valuemax={100}
						tabindex="-1"
					>
						<div class="h-full bg-text-primary transition-[width] duration-100" style:width="{progress}%"></div>
					</div>
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
									<Music class="h-4 w-4" />
								</div>
							{/if}
							<div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
								{#if playing}
									<Pause class="h-4 w-4 text-white" fill="currentColor" />
								{:else}
									<Play class="h-4 w-4 text-white" fill="currentColor" />
								{/if}
							</div>
						</button>
					{:else}
						<div class="flex h-11 w-11 items-center justify-center rounded-lg border border-border-primary bg-bg-primary text-text-disabled">
							<Music class="h-4 w-4" />
						</div>
					{/if}
				</div>
			{:else}
				<div class="relative flex min-h-18 items-center gap-2.5 px-4 pt-px">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="absolute inset-x-0 top-0 h-px cursor-pointer bg-border-primary"
						onclick={handleProgressClick}
						onkeydown={() => {}}
						role="slider"
						aria-label="播放进度"
						aria-valuenow={Math.round(progress)}
						aria-valuemin={0}
						aria-valuemax={100}
						tabindex="-1"
					>
						<div class="h-full bg-text-primary transition-[width] duration-100" style:width="{progress}%"></div>
					</div>
					<div class="h-10 w-10 shrink-0 overflow-hidden rounded border border-border-primary bg-bg-primary">
						{#if track?.cover_file_key}
							<img src={`/files/${track.cover_file_key}`} alt="" class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center text-text-disabled">
								<Music class="h-4 w-4" />
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
					<div class="flex shrink-0 items-center gap-1">
						<button
							onclick={requestPlayPrevious}
							class="flex h-7 w-7 items-center justify-center rounded-full text-text-primary transition-colors hover:text-primary"
							aria-label="上一首"
						>
							<SkipBack class="h-4 w-4" fill="currentColor" />
						</button>
						<button
							onclick={hasTracks ? requestTogglePlay : undefined}
							disabled={!hasTracks}
							class="flex h-7 w-7 items-center justify-center rounded-full text-text-primary transition-colors"
							class:hover:text-primary={hasTracks}
							class:opacity-30={!hasTracks}
							aria-label={playing ? '暂停' : '播放'}
						>
							{#if playing}
								<Pause class="h-4 w-4" fill="currentColor" />
							{:else}
								<Play class="h-4 w-4" fill="currentColor" />
							{/if}
						</button>
						<button
							onclick={requestPlayNext}
							class="flex h-7 w-7 items-center justify-center rounded-full text-text-primary transition-colors hover:text-primary"
							aria-label="下一首"
						>
							<SkipForward class="h-4 w-4" fill="currentColor" />
						</button>
					</div>
				</div>
			{/if}
		</aside>

		<main class="flex-1 overflow-auto bg-bg-secondary">
			{@render children()}
		</main>
	</div>
</div>
