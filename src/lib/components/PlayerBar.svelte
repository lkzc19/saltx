<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Howl } from 'howler';
	import { playerState, registerPlayerControls } from '$lib/stores/admin.svelte';
	import { buildMusicFileKey, getR2Url } from '$lib/utils/music';
	import { get } from 'svelte/store';

	function getMusicUrl(track: { id: string; version: string; extension: string }): string {
		return getR2Url(buildMusicFileKey(track.id, track.version, track.extension));
	}

	onMount(() => {
		if (!browser) return;

		let HowlClass: typeof Howl | null = null;
		let sound: Howl | null = null;
		let animFrame = 0;
		let currentTrackId: string | null = null;

		function updateTime() {
			if (sound && sound.state() === 'loaded') {
				const s = sound;
				playerState.update((st) => ({ ...st, currentTime: s.seek() as number }));
			}
			animFrame = requestAnimationFrame(updateTime);
		}

		function togglePlay() {
			if (!sound) return;
			if (get(playerState).playing) {
				sound.pause();
			} else {
				sound.play();
			}
		}

		function seekTo(time: number) {
			if (sound && sound.state() === 'loaded') {
				sound.seek(time);
			}
		}

		registerPlayerControls(togglePlay, seekTo);

		function loadTrack(track: { id: string; version: string; extension: string } | null) {
			if (sound) {
				sound.unload();
				cancelAnimationFrame(animFrame);
				sound = null;
			}
			if (!track || !HowlClass) return;

			const howl = new HowlClass({
				src: [getMusicUrl(track)],
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
				onloaderror(_id: number, err: unknown) {
					console.error('Howler load error:', err);
				},
				onplayerror(_id: number, err: unknown) {
					console.error('Howler play error:', err);
				}
			});
			sound = howl;
			howl.play();
		}

		// 手动订阅，仅在 track id 变化时重新加载
		const unsubscribe = playerState.subscribe((state) => {
			const newId = state.currentTrack?.id ?? null;
			if (newId !== currentTrackId) {
				currentTrackId = newId;
				if (HowlClass) {
					loadTrack(state.currentTrack);
				}
			}
		});

		// 加载 Howler，若此时已有待播 track 立即加载
		import('howler').then((m) => {
			HowlClass = m.Howl;
			const state = get(playerState);
			if (state.currentTrack && currentTrackId === state.currentTrack.id) {
				loadTrack(state.currentTrack);
			}
		});

		return () => {
			unsubscribe();
			if (sound) {
				sound.unload();
				cancelAnimationFrame(animFrame);
			}
		};
	});
</script>
