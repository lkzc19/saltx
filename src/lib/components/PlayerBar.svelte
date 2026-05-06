<script lang="ts">
	import { browser } from '$app/environment';
	import { playerState } from '$lib/stores/admin.svelte';
	import { buildFileKey, getR2Url } from '$lib/utils/music';

	let { r2PublicUrl = '' }: { r2PublicUrl?: string } = $props();

	class Howl {
		constructor(_opts: any) {}
		play() {}
		pause() {}
		stop() {}
		unload() {}
		state() { return 'loaded'; }
		seek(_pos?: number) { return 0; }
		duration() { return 0; }
	}

	let sound: any = null;
	let dragging = false;
	let animFrame = 0;

	let track = $derived($playerState.currentTrack);
	let playing = $derived($playerState.playing);
	let duration = $derived($playerState.duration);
	let currentTime = $derived($playerState.currentTime);
	let progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

	// 动态 import howler（只在浏览器）
	let HowlClass: any = null;
	if (browser) {
		import('howler').then((m) => {
			HowlClass = m.Howl;
		});
	}

	function getMusicUrl(track: { id: string; version: string; extension: string }): string {
		const key = buildFileKey(track.id, track.version, track.extension);
		return getR2Url(key);
	}

	function formatTime(s: number): string {
		if (!isFinite(s) || s < 0) return '0:00';
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	function updateTime() {
		if (sound && sound.state() === 'loaded') {
			playerState.update((s) => ({ ...s, currentTime: sound!.seek() as number }));
		}
		animFrame = requestAnimationFrame(updateTime);
	}

	$effect(() => {
		const t = track;
		if (!t || !HowlClass) return;

		if (sound) {
			sound.unload();
			cancelAnimationFrame(animFrame);
		}

		const url = getMusicUrl(t);
		const howl = new HowlClass({
			src: [url],
			html5: true,
			onplay() {
				playerState.update((s) => ({ ...s, playing: true }));
				animFrame = requestAnimationFrame(updateTime);
			},
			onpause() {
				playerState.update((s) => ({ ...s, playing: false }));
				cancelAnimationFrame(animFrame);
			},
			onstop() {
				playerState.update((s) => ({ ...s, playing: false, currentTime: 0 }));
				cancelAnimationFrame(animFrame);
			},
			onend() {
				playerState.update((s) => ({ ...s, playing: false, currentTime: 0 }));
				cancelAnimationFrame(animFrame);
			},
			onload() {
				playerState.update((s) => ({ ...s, duration: howl.duration() }));
			},
			onloaderror(_id: any, err: any) {
				console.error('Howler load error:', err);
			},
			onplayerror(_id: any, err: any) {
				console.error('Howler play error:', err);
			}
		});

		sound = howl;
		howl.play();

		return () => {
			howl.unload();
			cancelAnimationFrame(animFrame);
		};
	});

	function togglePlay() {
		if (!sound) return;
		if (playing) {
			sound.pause();
		} else {
			sound.play();
		}
	}

	function handleProgressClick(e: MouseEvent) {
		if (!sound || !duration) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const ratio = (e.clientX - rect.left) / rect.width;
		sound.seek(ratio * duration);
	}
</script>

{#if track}
	<div class="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-border bg-bg-card px-4" style="backdrop-filter: blur(12px);">
		<div class="flex items-center gap-3">
			<button
				onclick={togglePlay}
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:text-primary"
			>
				{#if playing}
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z" />
					</svg>
				{/if}
			</button>
			<div class="min-w-0">
				<p class="truncate text-sm text-text">{track.name}</p>
				<p class="truncate text-xs text-text-muted">{track.artist} · {track.version}</p>
			</div>
		</div>

		<div class="mx-6 flex flex-1 items-center gap-3">
			<span class="w-10 text-right font-mono text-xs text-text-disabled">{formatTime(currentTime)}</span>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="group relative h-1 flex-1 cursor-pointer rounded-full bg-border"
				onclick={handleProgressClick}
				onmousedown={() => (dragging = true)}
				onmouseup={() => (dragging = false)}
			>
				<div class="h-full rounded-full bg-primary transition-[width]" style="width: {progress}%"></div>
				<div
					class="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"
					style="left: calc({progress}% - 6px)"
				></div>
			</div>
			<span class="w-10 font-mono text-xs text-text-disabled">{formatTime(duration)}</span>
		</div>
	</div>
{/if}