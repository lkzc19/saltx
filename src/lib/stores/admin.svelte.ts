import { writable } from 'svelte/store';
import type { Music, Image } from '$lib/types/music';

export const adminState = $state({
	sidebarCollapsed: false,
	selectedMusic: null as Music | null,
	selectedImage: null as Image | null,
	uploadOpen: false
});

export const playerState = writable({
	currentTrack: null as Music | null,
	playing: false,
	duration: 0,
	currentTime: 0
});

// 音频控制回调，由 initPlayer 注册
let _togglePlay: (() => void) | null = null;
let _seek: ((time: number) => void) | null = null;

export function registerPlayerControls(
	togglePlay: () => void,
	seek: (time: number) => void
) {
	_togglePlay = togglePlay;
	_seek = seek;
}

export function requestTogglePlay() {
	_togglePlay?.();
}

export function requestSeek(time: number) {
	_seek?.(time);
}
