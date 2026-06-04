import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { playerState, registerPlayerControls } from '$lib/stores/admin.svelte';
import { getMusicUrl } from '$lib/utils/music';

export async function initPlayer() {
	if (!browser) return;

	const { Howl } = await import('howler');
	let sound: Howl | null = null;
	let animFrame = 0;
	let currentTrackId: string | null = null;

	function updateTime() {
		if (sound && sound.state() === 'loaded') {
			playerState.update((st) => ({ ...st, currentTime: sound!.seek() as number }));
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

	function playIndex(index: number) {
		const state = get(playerState);
		if (index < 0 || index >= state.tracks.length) return;
		const track = state.tracks[index];
		playerState.update((s) => ({ ...s, currentIndex: index, currentTrack: track, playing: true }));
	}

	function loadTrack(track: { file_key: string } | null) {
		if (sound) {
			sound.unload();
			cancelAnimationFrame(animFrame);
			sound = null;
		}
		if (!track) return;

		const howl = new Howl({
			src: [getMusicUrl(track.file_key)],
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
				cancelAnimationFrame(animFrame);
				// 自动播放下一首
				const state = get(playerState);
				const nextIndex = (state.currentIndex + 1) % state.tracks.length;
				if (state.tracks.length > 0) {
					const nextTrack = state.tracks[nextIndex];
					playerState.update((s) => ({ ...s, currentIndex: nextIndex, currentTrack: nextTrack, playing: false, currentTime: 0 }));
				} else {
					playerState.update((s) => ({ ...s, playing: false, currentTime: 0 }));
				}
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

	registerPlayerControls(togglePlay, seekTo, playIndex);

	const unsubscribe = playerState.subscribe((state) => {
		const newId = state.currentTrack?.id ?? null;
		if (newId !== currentTrackId) {
			currentTrackId = newId;
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
}
