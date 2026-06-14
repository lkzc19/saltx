<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import ChevronDoubleLeftIcon from '@iconify-svelte/line-md/chevron-double-left';
	import ChevronDoubleRightIcon from '@iconify-svelte/line-md/chevron-double-right';
	import PauseIcon from '@iconify-svelte/line-md/pause';
	import PlayIcon from '@iconify-svelte/line-md/play';
	import SwitchIcon from '@iconify-svelte/line-md/switch';
	import SwitchOffIcon from '@iconify-svelte/line-md/switch-off';
	import type { Music } from '$lib/types/music';
	import { getR2Url } from '$lib/utils/music';

	type PlayerTrack = Music;
	type AudioContextWindow = Window &
		typeof globalThis & { webkitAudioContext?: typeof AudioContext };

	const IDLE_TIMEOUT = 3000;
	const DRAWER_CLOSE_DELAY = 1000;
	const BAR_COUNT = 120;
	const DEFAULT_BACKGROUND = '#243042';
	const DEFAULT_BACKGROUND_RGB = '36, 48, 66';
	const DEFAULT_BAR_HEIGHT = 0.04;

	let tracks = $state<PlayerTrack[]>([]);
	let loading = $state(true);
	let error = $state('');
	let currentIndex = $state(0);
	let currentTime = $state(0);
	let duration = $state(0);
	let playing = $state(false);
	let idleChromeHidden = $state(false);
	let drawerOpen = $state(false);
	let drawerPinned = $state(false);
	let urlSyncReady = $state(false);
	let audioEl = $state<HTMLAudioElement | null>(null);
	let waveHeights = $state<number[]>(Array.from({ length: BAR_COUNT }, () => DEFAULT_BAR_HEIGHT));

	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let drawerCloseTimer: ReturnType<typeof setTimeout> | undefined;
	let initialTrackIdFromUrl: string | null = null;
	let animationFrame = 0;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let sourceNode: MediaElementAudioSourceNode | null = null;
	let frequencyData: InstanceType<typeof Uint8Array> | null = null;
	let mediaQuery: MediaQueryList | null = null;

	const currentTrack = $derived(tracks[currentIndex] ?? null);
	const backgroundHex = $derived(currentTrack?.background_color ?? DEFAULT_BACKGROUND);
	const backgroundRgb = $derived(hexToRgb(backgroundHex));
	const isLightTheme = $derived(isLightColor(backgroundHex));
	const captionText = $derived(
		tracks.length > 0
			? `歌曲按顺序播放 · ${String(currentIndex + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`
			: 'SALT X 勾栏听曲'
	);

	function hexToRgb(hex: string): string {
		const normalized = hex.replace('#', '');
		if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return DEFAULT_BACKGROUND_RGB;
		const red = parseInt(normalized.slice(0, 2), 16);
		const green = parseInt(normalized.slice(2, 4), 16);
		const blue = parseInt(normalized.slice(4, 6), 16);
		return `${red}, ${green}, ${blue}`;
	}

	function isLightColor(hex: string): boolean {
		const normalized = hex.replace('#', '');
		if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return false;
		const r = parseInt(normalized.slice(0, 2), 16) / 255;
		const g = parseInt(normalized.slice(2, 4), 16) / 255;
		const b = parseInt(normalized.slice(4, 6), 16) / 255;
		const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
		return luminance > 0.5;
	}

	function formatTime(value: number): string {
		if (!isFinite(value) || value < 0) return '0:00';
		const minutes = Math.floor(value / 60);
		const seconds = Math.floor(value % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function getRequestedTrackId(): string | null {
		if (typeof window === 'undefined') return null;
		return window.location.search ? new URLSearchParams(window.location.search).get('id') : null;
	}

	function getTrackIndexById(trackId: string | null, items: PlayerTrack[]): number {
		if (!trackId) return 0;
		const index = items.findIndex((item) => item.id === trackId);
		return index >= 0 ? index : 0;
	}

	function syncTrackIdToUrl(trackId: string | null) {
		if (typeof window === 'undefined') return;

		const url = new URL(window.location.href);
		if (trackId) {
			if (url.searchParams.get('id') === trackId) return;
			url.searchParams.set('id', trackId);
		} else {
			if (!url.searchParams.has('id')) return;
			url.searchParams.delete('id');
		}

		window.history.replaceState(window.history.state, '', url);
	}

	function clearDrawerCloseTimer() {
		if (drawerCloseTimer) clearTimeout(drawerCloseTimer);
	}

	function resetIdleTimer() {
		if (!mediaQuery?.matches) return;
		idleChromeHidden = false;
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			idleChromeHidden = true;
		}, IDLE_TIMEOUT);
	}

	function openDrawer() {
		clearDrawerCloseTimer();
		drawerOpen = true;
	}

	function closeDrawer() {
		if (drawerPinned) return;
		clearDrawerCloseTimer();
		drawerCloseTimer = setTimeout(() => {
			drawerOpen = false;
		}, DRAWER_CLOSE_DELAY);
	}

	function toggleDrawer() {
		if (drawerOpen) {
			drawerOpen = false;
			drawerPinned = false;
			clearDrawerCloseTimer();
			return;
		}

		openDrawer();
	}

	function toggleDrawerPinned() {
		drawerPinned = !drawerPinned;
		if (drawerPinned) {
			openDrawer();
			return;
		}

		clearDrawerCloseTimer();
	}

	function setupIdleChrome() {
		mediaQuery = window.matchMedia('(pointer:fine)');
		if (!mediaQuery.matches) return;
		const reveal = () => resetIdleTimer();
		window.addEventListener('mousemove', reveal);
		window.addEventListener('keydown', reveal);
		resetIdleTimer();

		return () => {
			window.removeEventListener('mousemove', reveal);
			window.removeEventListener('keydown', reveal);
		};
	}

	async function fetchTracks() {
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/music');
			if (!res.ok) throw new Error('获取音乐列表失败');
			const data = (await res.json()) as { items: PlayerTrack[] };
			tracks = data.items;
			currentIndex = getTrackIndexById(initialTrackIdFromUrl, data.items);
			if (data.items.length === 0) error = '暂无可播放的音乐';
		} catch (err) {
			error = (err as Error).message;
		} finally {
			loading = false;
			urlSyncReady = true;
		}
	}

	function destroyAudioGraph() {
		if (animationFrame) cancelAnimationFrame(animationFrame);
		animationFrame = 0;
		if (sourceNode) {
			sourceNode.disconnect();
			sourceNode = null;
		}
		if (analyser) {
			analyser.disconnect();
			analyser = null;
		}
		if (audioContext) {
			void audioContext.close();
			audioContext = null;
		}
		frequencyData = null;
	}

	async function ensureAudioGraph() {
		if (!audioEl) return;

		const ctor = window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
		if (!ctor) return;

		if (!audioContext) {
			audioContext = new ctor();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.82;
			sourceNode = audioContext.createMediaElementSource(audioEl);
			sourceNode.connect(analyser);
			analyser.connect(audioContext.destination);
			frequencyData = new Uint8Array(analyser.frequencyBinCount);
			startWaveformLoop();
		}

		if (audioContext.state === 'suspended') {
			await audioContext.resume();
		}
	}

	function startWaveformLoop() {
		if (animationFrame) cancelAnimationFrame(animationFrame);

		const tick = () => {
			if (analyser && frequencyData && playing) {
				const data = frequencyData;
				analyser.getByteFrequencyData(data);
				const nextHeights = Array.from({ length: BAR_COUNT }, (_, index) => {
					const start = Math.floor((index / BAR_COUNT) * data.length * 0.82);
					const end = Math.max(
						start + 1,
						Math.floor(((index + 1) / BAR_COUNT) * data.length * 0.82)
					);
					let sum = 0;
					for (let cursor = start; cursor < end; cursor += 1) sum += data[cursor];
					const average = sum / (end - start);
					const normalized = Math.pow(average / 255, 0.9);
					return Math.min(0.42, Math.max(DEFAULT_BAR_HEIGHT, normalized * 0.38));
				});

				waveHeights = waveHeights.map((value, index) => value * 0.55 + nextHeights[index] * 0.45);
			} else {
				waveHeights = waveHeights.map((value) => value * 0.88 + DEFAULT_BAR_HEIGHT * 0.12);
			}

			animationFrame = window.requestAnimationFrame(tick);
		};

		animationFrame = window.requestAnimationFrame(tick);
	}

	function getTrackIndex(index: number): number {
		if (tracks.length === 0) return 0;
		return (index + tracks.length) % tracks.length;
	}

	async function playAudio() {
		if (!audioEl) return;

		await ensureAudioGraph();
		try {
			await audioEl.play();
			playing = true;
		} catch {
			playing = false;
		}
	}

	async function loadTrack(index: number, autoplay = false) {
		if (!audioEl || tracks.length === 0) return;

		const nextIndex = getTrackIndex(index);
		const track = tracks[nextIndex];
		currentIndex = nextIndex;
		currentTime = 0;
		duration = 0;
		audioEl.src = getR2Url(track.file_key);
		audioEl.load();

		if (!autoplay) {
			playing = false;
			resetIdleTimer();
			return;
		}

		await playAudio();
		resetIdleTimer();
	}

	async function togglePlay() {
		if (!audioEl || tracks.length === 0) return;
		resetIdleTimer();

		if (!audioEl.src) {
			await loadTrack(currentIndex, true);
			return;
		}

		if (playing) {
			audioEl.pause();
			playing = false;
			return;
		}

		await playAudio();
	}

	async function playPrevious() {
		await loadTrack(currentIndex - 1, playing);
	}

	async function playNext() {
		await loadTrack(currentIndex + 1, playing);
	}

	async function selectTrack(index: number) {
		await loadTrack(index, true);
	}

	function handleTimeUpdate() {
		if (audioEl) currentTime = audioEl.currentTime;
	}

	function handleLoadedMetadata() {
		if (audioEl) duration = audioEl.duration || 0;
	}

	function handleSeek(event: Event) {
		if (!audioEl) return;
		const value = Number((event.currentTarget as HTMLInputElement).value);
		audioEl.currentTime = value;
		currentTime = value;
		resetIdleTimer();
	}

	async function handleEnded() {
		await loadTrack(currentIndex + 1, true);
	}

	onMount(() => {
		initialTrackIdFromUrl = getRequestedTrackId();
		void fetchTracks();
		const cleanupIdle = setupIdleChrome();

		return () => {
			if (cleanupIdle) cleanupIdle();
		};
	});

	$effect(() => {
		if (audioEl && tracks.length > 0 && !audioEl.src) {
			void loadTrack(currentIndex, false);
		}
	});

	$effect(() => {
		if (!urlSyncReady) return;
		syncTrackIdToUrl(currentTrack?.id ?? null);
	});

	onDestroy(() => {
		if (idleTimer) clearTimeout(idleTimer);
		if (drawerCloseTimer) clearTimeout(drawerCloseTimer);
		destroyAudioGraph();
	});
</script>

<svelte:head>
	<title>{currentTrack ? `${currentTrack.name} — SALT X` : 'SALT X'}</title>
</svelte:head>

<svelte:window
	onmousemove={resetIdleTimer}
	onmousedown={resetIdleTimer}
	ontouchstart={resetIdleTimer}
/>

<audio
	bind:this={audioEl}
	onended={handleEnded}
	ontimeupdate={handleTimeUpdate}
	onloadedmetadata={handleLoadedMetadata}
	onplay={() => (playing = true)}
	onpause={() => (playing = false)}
></audio>

<div class="player-page" data-theme={isLightTheme ? 'light' : 'dark'} style={`--accent-color:${backgroundHex}; --accent-rgb:${backgroundRgb};`}>
	<div
		class="drawer-edge-trigger"
		aria-hidden="true"
		onmouseenter={openDrawer}
		onmouseleave={closeDrawer}
	></div>

	<button
		type="button"
		class="drawer-toggle"
		onclick={toggleDrawer}
		aria-expanded={drawerOpen}
		aria-controls="track-drawer"
	>
		Tracks
	</button>

	<aside
		id="track-drawer"
		class="track-drawer"
		class:open={drawerOpen}
		onmouseenter={openDrawer}
		onmouseleave={closeDrawer}
	>
		<div class="drawer-header">
			<div class="drawer-heading">
				<p>歌曲列表</p>
				<span>{tracks.length} 首歌曲</span>
			</div>

			<button
				type="button"
				class="drawer-pin"
				class:active={drawerPinned}
				onclick={toggleDrawerPinned}
				aria-pressed={drawerPinned}
				aria-label={drawerPinned ? '解除固定抽屉' : '固定抽屉'}
				title={drawerPinned ? '解除固定' : '固定抽屉'}
			>
				{#if drawerPinned}
					<SwitchIcon height="1em" />
				{:else}
					<SwitchOffIcon height="1em" />
				{/if}
			</button>
		</div>
		<div class="drawer-list" role="list">
			{#if loading}
				<p class="drawer-state">正在装载歌曲...</p>
			{:else if error}
				<p class="drawer-state">{error}</p>
			{:else if tracks.length === 0}
				<p class="drawer-state">暂无歌曲</p>
			{:else}
				{#each tracks as track, index (track.id)}
					<button
						type="button"
						class="track-item"
						class:active={index === currentIndex}
						aria-current={index === currentIndex ? 'true' : undefined}
						onclick={() => selectTrack(index)}
					>
						<span class="track-order">{String(index + 1).padStart(2, '0')}</span>
						<span class="track-copy">
							<strong>{track.name}</strong>
							<small>{track.artist}</small>
						</span>
					</button>
				{/each}
			{/if}
		</div>
	</aside>

	<header class:hidden={idleChromeHidden}>
		<div class="logo">saltx</div>
	</header>

	<main>
		{#if loading}
			<div class="empty-state">正在装载音乐列表...</div>
		{:else if error}
			<div class="empty-state">{error}</div>
		{:else if currentTrack}
			<div class="stage">
				<div class="cover-column">
					<div class="cover-shell">
						{#if currentTrack.cover_file_key}
							<img
								class="cover"
								src={getR2Url(currentTrack.cover_file_key)}
								alt={currentTrack.name}
							/>
						{:else}
							<div class="cover placeholder">SALT X</div>
						{/if}
					</div>

					<div class="left-chrome" class:hidden={idleChromeHidden}>
						<div class="time-row">
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(duration)}</span>
						</div>

						<input
							class="progress"
							type="range"
							min="0"
							max={duration || 0}
							step="0.1"
							value={currentTime}
							oninput={handleSeek}
							aria-label="播放进度"
							style={`--progress:${duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'}`}
						/>

						<div class="transport">
							<button type="button" onclick={playPrevious} aria-label="上一首">
								<ChevronDoubleLeftIcon height="1em" />
							</button>
							<button
								type="button"
								class="play-toggle"
								onclick={togglePlay}
								aria-label={playing ? '暂停' : '播放'}
							>
								{#if playing}
									<PauseIcon height="1em" />
								{:else}
									<PlayIcon height="1em" />
								{/if}
							</button>
							<button type="button" onclick={playNext} aria-label="下一首">
								<ChevronDoubleRightIcon height="1em" />
							</button>
						</div>
					</div>
				</div>

				<div class="meta-column">
					<div class="meta-stack">
						<div class="track-info">
							<h1>{currentTrack.name}</h1>
							<p class="artist">{currentTrack.artist}</p>
						</div>

						<div class="waveform" aria-hidden="true">
							{#each waveHeights as height, index (index)}
								<span class="wave-bar" style={`--bar-height:${height}`}></span>
							{/each}
						</div>
					</div>

					<p class="caption">{captionText}</p>
				</div>
			</div>
		{/if}
	</main>

	<footer class:hidden={idleChromeHidden}>
		<p>SALT X 勾栏听曲</p>
	</footer>
</div>

<style>
	.player-page {
		--accent-color: #243042;
		--accent-rgb: 36, 48, 66;
		/* 暗色主题（默认） */
		--text-primary: rgba(255, 255, 255, 0.94);
		--text-secondary: rgba(255, 255, 255, 0.68);
		--text-muted: rgba(255, 255, 255, 0.44);
		--text-faint: rgba(255, 255, 255, 0.32);
		--text-ghost: rgba(255, 255, 255, 0.24);
		--border-color: rgba(255, 255, 255, 0.08);
		--border-active: rgba(255, 255, 255, 0.14);
		--bar-bg: rgba(255, 255, 255, 0.04);
		--bar-hover: rgba(255, 255, 255, 0.08);
		--wave-color: rgba(255, 255, 255, 0.92);
		--progress-active: #000;
		--progress-inactive: #fff;
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: var(--accent-color);
		color: var(--text-primary);
	}

	/* 亮色主题 */
	.player-page[data-theme="light"] {
		--text-primary: rgba(0, 0, 0, 0.88);
		--text-secondary: rgba(0, 0, 0, 0.62);
		--text-muted: rgba(0, 0, 0, 0.38);
		--text-faint: rgba(0, 0, 0, 0.28);
		--text-ghost: rgba(0, 0, 0, 0.18);
		--border-color: rgba(0, 0, 0, 0.1);
		--border-active: rgba(0, 0, 0, 0.18);
		--bar-bg: rgba(0, 0, 0, 0.05);
		--bar-hover: rgba(0, 0, 0, 0.1);
		--wave-color: rgba(0, 0, 0, 0.85);
		--progress-active: #fff;
		--progress-inactive: #000;
	}

	.drawer-edge-trigger {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 44px;
		z-index: 4;
	}

	.drawer-toggle,
	.track-drawer {
		position: fixed;
		right: 0;
		z-index: 5;
	}

	.drawer-toggle {
		top: 1.25rem;
		border: 0;
		padding: 0.68rem 0.9rem;
		background: rgba(8, 12, 18, 0.52);
		color: var(--text-primary);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		backdrop-filter: blur(18px);
		display: none;
	}

	.track-drawer {
		top: 0;
		bottom: 0;
		width: min(340px, calc(100vw - 1.5rem));
		padding: 1.2rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background:
			linear-gradient(180deg, var(--bar-hover), var(--bar-bg)),
			rgba(8, 12, 18, 0.68);
		border-left: 1px solid var(--border-color);
		backdrop-filter: blur(24px);
		transform: translateX(calc(100% + 8px));
		opacity: 0;
		pointer-events: none;
		transition:
			transform 0.24s ease,
			opacity 0.24s ease;
	}

	.track-drawer.open {
		transform: translateX(0);
		opacity: 1;
		pointer-events: auto;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.8rem;
		border-bottom: 1px solid var(--border-color);
	}

	.drawer-heading {
		display: flex;
		flex-direction: column;
		gap: 0.32rem;
	}

	.drawer-header p,
	.drawer-header span,
	.drawer-state {
		margin: 0;
	}

	.drawer-header p {
		font-size: 0.82rem;
		letter-spacing: 0.26em;
		text-transform: uppercase;
		color: var(--text-primary);
	}

	.drawer-header span,
	.drawer-state {
		font-size: 0.68rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.drawer-pin {
		flex: 0 0 auto;
		width: 36px;
		height: 36px;
		border: 1px solid var(--border-color);
		background: var(--bar-bg);
		color: var(--text-secondary);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.drawer-pin:hover {
		background: var(--bar-hover);
		color: var(--text-primary);
		transform: translateY(-1px);
	}

	.drawer-pin.active {
		background: rgba(var(--accent-rgb), 0.34);
		border-color: var(--border-active);
		color: var(--text-primary);
	}

	.drawer-pin :global(svg) {
		width: 16px;
		height: 16px;
	}

	.drawer-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		min-height: 0;
		overflow-y: auto;
		padding-right: 0.1rem;
	}

	.track-item {
		width: 100%;
		border: 0;
		padding: 0.9rem 0.85rem;
		background: var(--bar-bg);
		color: inherit;
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.9rem;
		text-align: left;
		cursor: pointer;
		transition:
			background 0.2s ease,
			transform 0.2s ease,
			border-color 0.2s ease;
	}

	.track-item:hover {
		background: var(--bar-hover);
		transform: translateX(-2px);
	}

	.track-item.active {
		background: rgba(var(--accent-rgb), 0.34);
		outline: 1px solid var(--border-active);
	}

	.track-order {
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.track-copy {
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
		min-width: 0;
	}

	.track-copy strong,
	.track-copy small {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.track-copy strong {
		font-size: 0.94rem;
		font-weight: 520;
		color: var(--text-primary);
	}

	.track-copy small {
		font-size: 0.74rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	header,
	footer,
	.left-chrome {
		transition: opacity 0.28s ease;
		will-change: opacity;
	}

	header.hidden,
	footer.hidden,
	.left-chrome.hidden {
		opacity: 0;
		pointer-events: none;
	}

	header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1;
		padding: 2rem 2.5rem;
	}

	.logo {
		font-size: 0.82rem;
		letter-spacing: 0.42em;
		text-transform: uppercase;
		color: var(--text-primary);
	}

	main {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		padding: 6.8rem 2.5rem 4.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stage {
		--panel-width: clamp(320px, 32vw, 360px);
		--panel-gap: calc(var(--panel-width) * 0.3);
		width: min(calc(var(--panel-width) * 2 + var(--panel-gap)), 100%);
		display: grid;
		grid-template-columns: repeat(2, var(--panel-width));
		justify-content: center;
		align-items: start;
		gap: var(--panel-gap);
	}

	.cover-column {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 1.1rem;
		width: 100%;
		max-width: 360px;
		justify-self: center;
	}

	.cover-shell {
		position: relative;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: var(--bar-bg);
	}

	.cover {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
	}

	.cover.placeholder {
		display: grid;
		place-items: center;
		height: 100%;
		font-size: 1rem;
		letter-spacing: 0.4em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.left-chrome {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.time-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.progress {
		width: 100%;
		height: 14px;
		margin: 0;
		padding: 0;
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
		border: 0;
		cursor: pointer;
		outline: none;
	}

	.progress::-webkit-slider-runnable-track {
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(
			to right,
			var(--progress-active) 0,
			var(--progress-active) var(--progress),
			var(--progress-inactive) var(--progress),
			var(--progress-inactive) 100%
		);
	}

	.progress::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 10px;
		height: 10px;
		margin-top: -4px;
		border-radius: 50%;
		background: #8a8a8a;
		border: 0;
		box-shadow: none;
	}

	.progress::-moz-range-track {
		height: 2px;
		border: 0;
		border-radius: 999px;
		background: var(--progress-inactive);
	}

	.progress::-moz-range-progress {
		height: 2px;
		border-radius: 999px;
		background: var(--progress-active);
	}

	.progress::-moz-range-thumb {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #8a8a8a;
		border: 0;
		box-shadow: none;
	}

	.transport {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.4rem;
	}

	.transport button {
		width: 42px;
		height: 42px;
		border: 0;
		background: transparent;
		color: var(--text-primary);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			color 0.2s ease,
			transform 0.2s ease,
			background 0.2s ease;
	}

	.transport button:hover {
		color: var(--text-primary);
		transform: translateY(-1px);
	}

	.transport :global(svg) {
		width: 18px;
		height: 18px;
	}

	.play-toggle {
		width: 54px !important;
		height: 54px !important;
		color: var(--text-primary) !important;
	}

	.play-toggle :global(svg) {
		width: 22px;
		height: 22px;
	}

	.meta-column {
		width: 100%;
		max-width: 360px;
		height: 360px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		justify-self: center;
		padding: 0;
		text-align: center;
	}

	.meta-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		flex: 1;
		width: 100%;
	}

	.track-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: calc(var(--panel-width) * 0.25 - 2.8rem);
	}

	h1 {
			font-family: "PingFangShangShangQianTi", sans-serif;
		margin: 0;
		font-size: clamp(2.2rem, 4.5vw, 3.2rem);
		line-height: 1.04;
		font-weight: 320;
		letter-spacing: -0.03em;
		max-width: 12ch;
		text-wrap: balance;
	}

	.artist {
			font-family: "PingFangShangShangQianTi", sans-serif;
		margin: 0.4rem 0 0;
		font-size: 2.1rem;
		font-weight: 520;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.waveform {
		margin-top: 1.8rem;
		width: 100%;
		height: 38px;
		display: grid;
		grid-template-columns: repeat(120, minmax(0, 1fr));
		align-items: end;
		gap: 0;
	}

	.wave-bar {
		display: block;
		width: 1px;
		justify-self: center;
		height: calc(var(--bar-height) * 100%);
		min-height: 5px;
		background: var(--wave-color);
		opacity: 0.9;
		transition:
			height 0.12s linear,
			opacity 0.18s ease;
	}

	.caption {
		width: 100%;
		margin: 0.38rem 0 0;
		font-size: 0.74rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--text-faint);
	}

	footer {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
		padding: 0 2.5rem 1.6rem;
		text-align: center;
	}

	footer p {
		margin: 0;
		font-size: 0.68rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: var(--text-ghost);
	}

	.empty-state {
		font-size: 0.88rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	@media (max-width: 900px) {
		.drawer-edge-trigger {
			display: none;
		}

		.drawer-toggle {
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.track-drawer {
			top: auto;
			left: 0;
			width: 100%;
			max-height: min(62vh, 520px);
			padding: 1rem 1rem 1.1rem;
			border-left: 0;
			border-top: 1px solid var(--border-color);
			transform: translateY(calc(100% + 8px));
		}

		.track-drawer.open {
			transform: translateY(0);
		}

		header {
			padding: 1.5rem 1.25rem;
		}

		main {
			padding: 5.5rem 1.25rem 4rem;
		}

		.stage {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.meta-column {
			max-width: 360px;
			height: auto;
			min-height: 300px;
		}

		.meta-stack {
			justify-content: center;
		}

		.track-info {
			padding-top: 0;
		}

		h1 {
			max-width: 12ch;
			font-size: clamp(1.8rem, 7vw, 2.5rem);
		}

		.waveform {
			height: 32px;
		}

		footer {
			padding: 0 1.25rem 1.25rem;
		}
	}
</style>
