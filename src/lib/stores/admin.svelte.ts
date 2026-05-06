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
