import { writable } from 'svelte/store';

export const playerStore = writable<{
	currentSong: string | null;
	albumName: string | null;
	playing: boolean;
}>({
	currentSong: null,
	albumName: null,
	playing: false
});
