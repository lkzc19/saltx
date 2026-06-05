import { writable, get } from 'svelte/store';
import type { Music } from '$lib/types/music';

export const adminState = $state({
	sidebarCollapsed: false,
	selectedMusic: null as Music | null,
	addingMusic: false
});

export const playerState = writable({
	tracks: [] as Music[],
	currentTrack: null as Music | null,
	currentIndex: -1,
	playing: false,
	duration: 0,
	currentTime: 0
});

// 音频控制回调，由 initPlayer 注册
let _togglePlay: (() => void) | null = null;
let _seek: ((time: number) => void) | null = null;
let _playIndex: ((index: number) => void) | null = null;

export function registerPlayerControls(
	togglePlay: () => void,
	seek: (time: number) => void,
	playIndex: (index: number) => void
) {
	_togglePlay = togglePlay;
	_seek = seek;
	_playIndex = playIndex;
}

export function requestTogglePlay() {
	const state = get(playerState);
	// 没有当前歌曲时，自动播放第一首
	if (!state.currentTrack && state.tracks.length > 0) {
		_playIndex?.(0);
		return;
	}
	_togglePlay?.();
}

export function requestSeek(time: number) {
	_seek?.(time);
}

export function requestPlayPrevious() {
	const state = get(playerState);
	if (state.tracks.length === 0) return;
	const index = (state.currentIndex - 1 + state.tracks.length) % state.tracks.length;
	_playIndex?.(index);
}

export function requestPlayNext() {
	const state = get(playerState);
	if (state.tracks.length === 0) return;
	const index = (state.currentIndex + 1) % state.tracks.length;
	_playIndex?.(index);
}

export function loadTracks(tracks: Music[]) {
	playerState.update((s) => ({ ...s, tracks }));
}
