import { writable } from 'svelte/store';

export const playerStore = writable<{
	currentSong: string | null;
	playing: boolean;
}>({
	currentSong: null,
	playing: false
});
