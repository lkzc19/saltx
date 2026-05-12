<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import SiteNavbar from '$lib/components/SiteNavbar.svelte';
	import SiteBg from '$lib/components/SiteBg.svelte';
	import { playerStore } from '$lib/stores/player';

	interface Track {
		id: string;
		name: string;
		artist: string;
		version: string;
		extension: string;
		cover_file_key: string | null;
		sort_order: number;
	}

	let { data } = $props();

	let trackIdx = $state(0);
	let playing = $state(false);
	let audioEl = $state<HTMLAudioElement | null>(null);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);
	let muted = $state(false);
	// repeat: 0 = off, 1 = all, 2 = one
	let repeat = $state(1);
	let seeking = $state(false);
	let showVolume = $state(false);

	const tracks = $derived(data.tracks as Track[]);

	$effect(() => {
		void data.current.id;
		trackIdx = data.initialTrack ?? 0;
		playing = false;
		currentTime = 0;
		duration = 0;
		if (audioEl) audioEl.src = '';
	});

	$effect(() => {
		const t = tracks[trackIdx];
		playerStore.set({
			currentSong: t?.name ?? null,
			albumName: data.current.name,
			playing
		});
	});

	onDestroy(() => {
		playerStore.set({ currentSong: null, albumName: null, playing: false });
	});

	function trackSrc(t: Track) {
		return `/files/music/${t.id}/${t.version}.${t.extension}`;
	}

	function play(idx: number) {
		if (!audioEl || idx < 0 || idx >= tracks.length) return;
		trackIdx = idx;
		audioEl.src = trackSrc(tracks[idx]);
		audioEl.volume = muted ? 0 : volume;
		audioEl.load();
		audioEl.play().then(() => { playing = true; }).catch(() => { playing = false; });
	}

	function togglePlay() {
		if (!audioEl || tracks.length === 0) return;
		if (!audioEl.src || audioEl.src === window.location.href) {
			play(trackIdx);
			return;
		}
		if (playing) {
			audioEl.pause();
			playing = false;
		} else {
			audioEl.play().then(() => { playing = true; }).catch(() => {});
		}
	}

	function prev() {
		const idx = trackIdx > 0 ? trackIdx - 1 : tracks.length - 1;
		play(idx);
	}

	function next() {
		const idx = trackIdx < tracks.length - 1 ? trackIdx + 1 : 0;
		play(idx);
	}

	function onEnded() {
		if (repeat === 2) {
			audioEl?.play();
		} else if (repeat === 1) {
			next();
		} else {
			if (trackIdx < tracks.length - 1) {
				play(trackIdx + 1);
			} else {
				playing = false;
			}
		}
	}

	function onTimeUpdate() {
		if (audioEl && !seeking) currentTime = audioEl.currentTime;
	}

	function onDurationChange() {
		if (audioEl) duration = audioEl.duration || 0;
	}

	function onAudioError() { playing = false; }

	function seekStart() { seeking = true; }

	function seekEnd(e: Event) {
		if (!audioEl) return;
		seeking = false;
		const v = parseFloat((e.target as HTMLInputElement).value);
		audioEl.currentTime = v;
		currentTime = v;
	}

	function seekInput(e: Event) {
		currentTime = parseFloat((e.target as HTMLInputElement).value);
	}

	function setVolume(e: Event) {
		volume = parseFloat((e.target as HTMLInputElement).value);
		if (audioEl) audioEl.volume = volume;
		muted = volume === 0;
	}

	function toggleMute() {
		muted = !muted;
		if (audioEl) audioEl.volume = muted ? 0 : volume;
	}

	function cycleRepeat() {
		repeat = (repeat + 1) % 3;
	}

	function formatTime(s: number) {
		if (!isFinite(s) || isNaN(s) || s < 0) return '0:00';
		const m = Math.floor(s / 60);
		return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
	}

	const curTrack = $derived(tracks[trackIdx]);
</script>

<svelte:head>
	<title>{curTrack?.name ?? data.current.name} — SALT X</title>
</svelte:head>

<audio
	bind:this={audioEl}
	onended={onEnded}
	ontimeupdate={onTimeUpdate}
	ondurationchange={onDurationChange}
	onerror={onAudioError}
></audio>

<div class="pr">
	<SiteBg />
	<SiteNavbar />

	<main class="mc">
		<div class="lp">
			<!-- 左：封面 -->
			<div class="lc">
				<a href="/album/{data.current.id}" class="back" aria-label="返回专辑详情">
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M15 18l-6-6 6-6" />
					</svg>
					<span>返回专辑</span>
				</a>

				<div class="cv">
					<div class="cv-corner cv-tl"></div>
					<div class="cv-corner cv-tr"></div>
					<div class="cv-corner cv-bl"></div>
					<div class="cv-corner cv-br"></div>
					{#if data.current.cover_file_key}
						<img src="/files/{data.current.cover_file_key}" alt={data.current.name} />
					{:else}
						<div class="cv-ph">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
								<circle cx="12" cy="12" r="10" />
								<circle cx="12" cy="12" r="3" />
								<circle cx="12" cy="12" r="6.5" stroke-dasharray="2 3" />
							</svg>
						</div>
					{/if}
				</div>

			<!-- 播放控件 -->
			<div class="player">
				<div class="player-times">
					<span class="pt">{formatTime(currentTime)}</span>
					<span class="pt">{formatTime(duration)}</span>
				</div>
				<input
					class="prog-range"
					type="range"
					min="0"
					max={duration || 1}
					step="0.1"
					value={currentTime}
					style="--pct:{duration > 0 ? (currentTime / duration) * 100 : 0}%"
					onmousedown={seekStart}
					ontouchstart={seekStart}
					oninput={seekInput}
					onchange={seekEnd}
					aria-label="播放进度"
				/>
				<div class="player-btns">
					<button class="cb" onclick={prev} aria-label="上一曲">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
						</svg>
					</button>
					<button class="cb cb-play" onclick={togglePlay} aria-label={playing ? '暂停' : '播放'}>
						{#if playing}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
								<rect x="6" y="4" width="4" height="16" rx="1" />
								<rect x="14" y="4" width="4" height="16" rx="1" />
							</svg>
						{:else}
							<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
								<path d="M8 5v14l11-7z" />
							</svg>
						{/if}
					</button>
					<button class="cb" onclick={next} aria-label="下一曲">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M19 6h-2v12h2zm-3.5 6L7 6v12z" />
						</svg>
					</button>
				</div>
			</div>
		</div>

			<!-- 右：曲目信息 + 列表 -->
			<div class="rp">
				<!-- 当前曲目信息 -->
				<div class="ci">
					<span class="ci-num">{String(trackIdx + 1).padStart(2, '0')} / {String(tracks.length).padStart(2, '0')}</span>
					<h1 class="ci-name">{curTrack?.name ?? '—'}</h1>
					<p class="ci-artist">{curTrack?.artist ?? ''}</p>
					{#if curTrack?.version && curTrack.version !== 'original'}
						<span class="ci-ver">{curTrack.version}</span>
					{/if}
				</div>

				<!-- 曲目列表 -->
				<div class="tl">
					<div class="tl-hd">
						<span class="tl-label">TRACK LIST</span>
					</div>
					<ul class="tl-ul">
						{#each tracks as track, i (track.id)}
							<li>
								<button
									class="ti"
									class:active={trackIdx === i}
									class:playing={trackIdx === i && playing}
									onclick={() => play(i)}
								>
									<span class="ti-num">{String(i + 1).padStart(2, '0')}</span>
									<span class="ti-name">{track.name}</span>
									{#if track.version && track.version !== 'original'}
										<span class="ti-ver">{track.version}</span>
									{/if}
									<span class="ti-artist">{track.artist}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

	</main>
</div>

<style>
	.pr {
		min-height: 100vh;
		background-color: #07070f;
		position: relative;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
	}
	.mc {
		max-width: 1440px;
		width: 100%;
		margin: 0 auto;
		padding: 7rem 5rem 4rem;
		position: relative;
		z-index: 1;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	/* 返回链接 */
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.62rem;
		letter-spacing: 0.15em;
		color: rgba(255,255,255,0.25);
		text-decoration: none;
		transition: color 0.2s;
		margin-bottom: 1.25rem;
	}
	.back:hover { color: rgba(255,255,255,0.7); }

	/* 主布局 */
	.lp {
		display: flex;
		gap: 5rem;
		align-items: flex-start;
		flex: 1;
	}

	/* 左：封面 */
	.lc {
		flex: 0 0 380px;
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 7rem;
	}
	.cv {
		position: relative;
		aspect-ratio: 1/1;
		overflow: hidden;
		background: #0d0d1c;
		transition: box-shadow 0.5s;
	}
	.cv img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.cv-ph {
		width: 100%; height: 100%;
		display: flex; align-items: center; justify-content: center;
		color: rgba(255,255,255,0.08);
	}
	.cv-ph svg { width: 50%; height: 50%; }
	.cv-corner {
		position: absolute; width: 16px; height: 16px;
		z-index: 2; pointer-events: none;
	}
	.cv-tl { top: -1px; left: -1px; border-top: 1px solid #38b6ff; border-left: 1px solid #38b6ff; }
	.cv-tr { top: -1px; right: -1px; border-top: 1px solid #38b6ff; border-right: 1px solid #38b6ff; }
	.cv-bl { bottom: -1px; left: -1px; border-bottom: 1px solid #38b6ff; border-left: 1px solid #38b6ff; }
	.cv-br { bottom: -1px; right: -1px; border-bottom: 1px solid #38b6ff; border-right: 1px solid #38b6ff; }
	/* 右：信息 */
	.rp {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		padding-top: 0.25rem;
		overflow-y: auto;
		max-height: calc(100vh - 11rem);
	}
	/* 当前曲目信息 */
	.ci { display: flex; flex-direction: column; gap: 0.35rem; }
	.ci-num { font-size: 0.6rem; letter-spacing: 0.25em; color: rgba(255,255,255,0.2); }
	.ci-name {
		font-size: 2rem; font-weight: 200;
		letter-spacing: 0.06em; color: rgba(255,255,255,0.92);
		margin: 0; line-height: 1.2;
	}
	.ci-artist { font-size: 0.78rem; color: rgba(255,255,255,0.35); letter-spacing: 0.15em; margin: 0; }
	.ci-ver {
		align-self: flex-start;
		font-size: 0.58rem; color: rgba(56,182,255,0.5);
		border: 1px solid rgba(56,182,255,0.2); padding: 0.1em 0.4em;
		letter-spacing: 0.1em;
	}

	/* 曲目列表 */
	.tl { display: flex; flex-direction: column; gap: 0.5rem; }
	.tl-hd {
		display: flex; align-items: center; gap: 0.75rem;
		border-bottom: 1px solid rgba(255,255,255,0.06);
		padding-bottom: 0.5rem;
	}
	.tl-label { font-size: 0.6rem; letter-spacing: 0.4em; color: rgba(255,255,255,0.18); }
	.tl-ul { list-style: none; margin: 0; padding: 0; }

	.ti {
		width: 100%;
		display: flex; align-items: center; gap: 0.9rem;
		padding: 0.6rem 0.65rem;
		background: transparent; border: none;
		border-bottom: 1px solid rgba(255,255,255,0.04);
		color: rgba(255,255,255,0.35);
		cursor: pointer; font-family: inherit; text-align: left;
		transition: background 0.15s, color 0.15s, box-shadow 0.15s;
	}
	.ti:hover { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.75); box-shadow: inset 3px 0 0 rgba(255,255,255,0.15); }
	.ti.active { color: rgba(255,255,255,0.85); }
	.ti.playing { color: #38b6ff; box-shadow: inset 3px 0 0 rgba(56,182,255,0.6); background: rgba(56,182,255,0.03); }

	.ti-num {
		font-size: 0.62rem; color: rgba(255,255,255,0.18);
		min-width: 2em; text-align: right; flex-shrink: 0;
	}
	.ti.playing .ti-num { color: #38b6ff; }
	.ti-name { flex: 1; font-size: 0.78rem; letter-spacing: 0.05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.ti-ver {
		font-size: 0.58rem; color: rgba(56,182,255,0.4);
		border: 1px solid rgba(56,182,255,0.15); padding: 0.1em 0.3em;
		letter-spacing: 0.08em; flex-shrink: 0;
	}
	.ti-artist {
		font-size: 0.6rem; color: rgba(255,255,255,0.18);
		letter-spacing: 0.05em; flex-shrink: 0;
		max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}

	/* 播放控件（图片下方） */
	.player {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-top: 1rem;
	}
	.player-times {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.pt {
		font-size: 0.58rem;
		color: rgba(255,255,255,0.28);
		letter-spacing: 0.04em;
		font-variant-numeric: tabular-nums;
	}
	.prog-range {
		width: 100%;
		-webkit-appearance: none;
		appearance: none;
		height: 2px;
		background: linear-gradient(to right, rgba(56,182,255,0.75) var(--pct, 0%), rgba(255,255,255,0.1) var(--pct, 0%));
		outline: none;
		cursor: pointer;
		border-radius: 1px;
		display: block;
	}
	.prog-range::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 10px; height: 10px;
		border-radius: 50%;
		background: #38b6ff;
		cursor: pointer;
	}
	.prog-range::-moz-range-thumb {
		width: 10px; height: 10px;
		border-radius: 50%;
		background: #38b6ff;
		border: none; cursor: pointer;
	}
	.player-btns {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding-top: 0.25rem;
	}

	/* 控制按钮 */
	.cb {
		background: transparent; border: none;
		color: rgba(255,255,255,0.4);
		cursor: pointer; padding: 0.35rem;
		display: flex; align-items: center; justify-content: center;
		transition: color 0.2s;
	}
	.cb:hover { color: rgba(255,255,255,0.85); }
	.cb-play {
		width: 44px; height: 44px;
		border-radius: 50%;
		border: 1px solid rgba(56,182,255,0.35) !important;
		background: rgba(56,182,255,0.06) !important;
		color: #38b6ff !important;
		transition: background 0.2s, border-color 0.2s !important;
	}
	.cb-play:hover {
		background: rgba(56,182,255,0.14) !important;
		border-color: rgba(56,182,255,0.7) !important;
		color: #fff !important;
	}

	@media (max-width: 960px) {
		.mc { padding: 6rem 2rem 3rem; }
		.lp { flex-direction: column; gap: 2rem; }
		.lc { flex: none; width: 100%; max-width: 380px; position: static; }
		.rp { max-height: none; }
	}
	@media (max-width: 640px) {
		.mc { padding: 5.5rem 1.25rem 2.5rem; }
		.ci-name { font-size: 1.5rem; }
	}
</style>
