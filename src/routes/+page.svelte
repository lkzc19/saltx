<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import ChevronDoubleLeftIcon from '@iconify-svelte/line-md/chevron-double-left';
	import ChevronDoubleRightIcon from '@iconify-svelte/line-md/chevron-double-right';
	import PauseIcon from '@iconify-svelte/line-md/pause';
	import PlayIcon from '@iconify-svelte/line-md/play';
	import type { Music } from '$lib/types/music';
	import { getMusicUrl, getOriginalUrl } from '$lib/utils/music';

	type PlayerTrack = Music & { background_color?: string | null };
	type AudioContextWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

	const IDLE_TIMEOUT = 3000;
	const BAR_COUNT = 120;
	const DEFAULT_BACKGROUND = '#243042';
	const DEFAULT_BAR_HEIGHT = 0.08;

	let tracks = $state<PlayerTrack[]>([]);
	let loading = $state(true);
	let error = $state('');
	let currentIndex = $state(0);
	let currentTime = $state(0);
	let duration = $state(0);
	let playing = $state(false);
	let idleChromeHidden = $state(false);
	let audioEl = $state<HTMLAudioElement | null>(null);
	let waveHeights = $state<number[]>(Array.from({ length: BAR_COUNT }, () => DEFAULT_BAR_HEIGHT));

	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let animationFrame = 0;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let sourceNode: MediaElementAudioSourceNode | null = null;
	let frequencyData: InstanceType<typeof Uint8Array> | null = null;
	let mediaQuery: MediaQueryList | null = null;

	const currentTrack = $derived(tracks[currentIndex] ?? null);
	const backgroundHex = $derived(currentTrack?.background_color ?? DEFAULT_BACKGROUND);
	const backgroundRgb = $derived(hexToRgb(backgroundHex));
	const captionText = $derived(
		tracks.length > 0
			? `ALL TRACKS PLAY IN ORDER · ${String(currentIndex + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`
			: 'SALT X LISTENING ROOM'
	);

	function hexToRgb(hex: string): string {
		const normalized = hex.replace('#', '');
		if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '36, 48, 66';
		const red = parseInt(normalized.slice(0, 2), 16);
		const green = parseInt(normalized.slice(2, 4), 16);
		const blue = parseInt(normalized.slice(4, 6), 16);
		return `${red}, ${green}, ${blue}`;
	}

	function formatTime(value: number): string {
		if (!isFinite(value) || value < 0) return '0:00';
		const minutes = Math.floor(value / 60);
		const seconds = Math.floor(value % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function resetIdleTimer() {
		if (!mediaQuery?.matches) return;
		idleChromeHidden = false;
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			idleChromeHidden = true;
		}, IDLE_TIMEOUT);
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
			currentIndex = 0;
			if (data.items.length === 0) error = '暂无可播放的音乐';
		} catch (err) {
			error = (err as Error).message;
		} finally {
			loading = false;
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
				analyser.getByteFrequencyData(frequencyData);
				const nextHeights = Array.from({ length: BAR_COUNT }, (_, index) => {
					const start = Math.floor((index / BAR_COUNT) * frequencyData!.length * 0.82);
					const end = Math.max(start + 1, Math.floor(((index + 1) / BAR_COUNT) * frequencyData!.length * 0.82));
					let sum = 0;
					for (let cursor = start; cursor < end; cursor += 1) sum += frequencyData![cursor];
					const average = sum / (end - start);
					const normalized = Math.pow(average / 255, 1.2);
					return Math.min(0.26, Math.max(DEFAULT_BAR_HEIGHT, normalized * 0.22));
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

	async function loadTrack(index: number, autoplay = false) {
		if (!audioEl || tracks.length === 0) return;

		const nextIndex = getTrackIndex(index);
		const track = tracks[nextIndex];
		currentIndex = nextIndex;
		currentTime = 0;
		duration = 0;
		audioEl.src = getMusicUrl(track.file_key);
		audioEl.load();

		if (!autoplay) {
			playing = false;
			resetIdleTimer();
			return;
		}

		await ensureAudioGraph();
		try {
			await audioEl.play();
			playing = true;
		} catch {
			playing = false;
		}
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

		await ensureAudioGraph();
		try {
			await audioEl.play();
			playing = true;
		} catch {
			playing = false;
		}
	}

	async function playPrevious() {
		await loadTrack(currentIndex - 1, playing);
	}

	async function playNext() {
		await loadTrack(currentIndex + 1, playing);
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

	onDestroy(() => {
		if (idleTimer) clearTimeout(idleTimer);
		destroyAudioGraph();
	});
</script>

<svelte:head>
	<title>{currentTrack ? `${currentTrack.name} — SALT X` : 'SALT X'}</title>
</svelte:head>

<svelte:window onmousemove={resetIdleTimer} onmousedown={resetIdleTimer} ontouchstart={resetIdleTimer} />

<audio
	bind:this={audioEl}
	onended={handleEnded}
	ontimeupdate={handleTimeUpdate}
	onloadedmetadata={handleLoadedMetadata}
	onplay={() => (playing = true)}
	onpause={() => (playing = false)}
></audio>

<div
	class="player-page"
	style={`--accent-color:${backgroundHex}; --accent-rgb:${backgroundRgb};`}
>
	<div class="background-layer"></div>
	<div class="background-glow"></div>

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
							<img class="cover" src={getOriginalUrl(currentTrack.cover_file_key)} alt={currentTrack.name} />
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
							<button type="button" class="play-toggle" onclick={togglePlay} aria-label={playing ? '暂停' : '播放'}>
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
						<h1>{currentTrack.name}</h1>
						<p class="artist">{currentTrack.artist}</p>

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
		<p>SALT X listening room</p>
	</footer>
</div>

<style>
	.player-page {
		--accent-color: #243042;
		--accent-rgb: 36, 48, 66;
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		background: var(--accent-color);
		color: rgba(255, 255, 255, 0.94);
	}

	.background-layer,
	.background-glow {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.background-layer {
		display: none;
	}

	.background-glow {
		display: none;
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
		color: rgba(255, 255, 255, 0.88);
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
		background: rgba(255, 255, 255, 0.04);
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
		color: rgba(255, 255, 255, 0.55);
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
		color: rgba(255, 255, 255, 0.44);
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
		background: linear-gradient(to right, #000 0, #000 var(--progress), #fff var(--progress), #fff 100%);
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
		background: #fff;
	}

	.progress::-moz-range-progress {
		height: 2px;
		border-radius: 999px;
		background: #000;
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
		color: #fff;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: color 0.2s ease, transform 0.2s ease, background 0.2s ease;
	}

	.transport button:hover {
		color: rgba(255, 255, 255, 0.92);
		transform: translateY(-1px);
	}

	.transport :global(svg) {
		width: 18px;
		height: 18px;
	}

	.play-toggle {
		width: 54px !important;
		height: 54px !important;
		color: #fff !important;
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
		justify-content: flex-end;
		justify-self: center;
		padding: 0;
		text-align: center;
	}

	.meta-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		width: 100%;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.65rem, 3.2vw, 2.35rem);
		line-height: 1.04;
		font-weight: 320;
		letter-spacing: -0.03em;
		max-width: 12ch;
		text-wrap: balance;
	}

	.artist {
		margin: 1.1rem 0 0;
		font-size: 1.08rem;
		font-weight: 520;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.68);
	}

	.waveform {
		margin-top: 2rem;
		width: 100%;
		height: 52px;
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
		background: rgba(255, 255, 255, 0.92);
		opacity: 0.9;
		transition: height 0.12s linear, opacity 0.18s ease;
	}

	.caption {
		width: 100%;
		margin: 0.38rem 0 0;
		font-size: 0.74rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.32);
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
		color: rgba(255, 255, 255, 0.24);
	}

	.empty-state {
		font-size: 0.88rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.42);
	}

	@media (max-width: 900px) {
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

		h1 {
			max-width: 12ch;
			font-size: clamp(1.55rem, 6vw, 2.1rem);
		}

		.waveform {
			height: 46px;
		}

		footer {
			padding: 0 1.25rem 1.25rem;
		}
	}
</style>
