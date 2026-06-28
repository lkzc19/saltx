import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/files/')) {
		event.url.pathname = '/api' + event.url.pathname;
	}
	return resolve(event);
};
