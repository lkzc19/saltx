<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const IDLE_TIMEOUT = 3000;

	const isMusic = $derived(page.url.pathname.startsWith('/music'));
	const isInfo = $derived(page.url.pathname.startsWith('/info'));

	let idleHidden = $state(false);
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let mediaQuery: MediaQueryList | null = null;

	function resetIdleTimer() {
		if (!mediaQuery?.matches) return;
		idleHidden = false;
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(() => {
			idleHidden = true;
		}, IDLE_TIMEOUT);
	}

	onMount(() => {
		mediaQuery = window.matchMedia('(pointer:fine)');
		if (!mediaQuery.matches) return;

		const reveal = () => resetIdleTimer();
		window.addEventListener('mousemove', reveal);
		window.addEventListener('keydown', reveal);
		resetIdleTimer();

		return () => {
			window.removeEventListener('mousemove', reveal);
			window.removeEventListener('keydown', reveal);
			if (idleTimer) clearTimeout(idleTimer);
		};
	});
</script>

<svelte:window
	onmousemove={resetIdleTimer}
	onmousedown={resetIdleTimer}
	ontouchstart={resetIdleTimer}
/>

<div class="frontend-layout">
	<header class="site-header" class:hidden={idleHidden}>
		<a href={resolve('/music', {})} class="site-logo">saltx</a>
		<nav class="nav-links">
			<a href={resolve('/music', {})} class="nav-link" class:active={isMusic}>音乐</a>
			<a href={resolve('/info', {})} class="nav-link" class:active={isInfo}>动向</a>
		</nav>
	</header>

	{@render children()}
</div>

<style>
	.frontend-layout {
		--accent-color: #243042;
		--accent-rgb: 36, 48, 66;
		--text-primary: rgba(255, 255, 255, 0.94);
		--text-secondary: rgba(255, 255, 255, 0.68);
		--text-muted: rgba(255, 255, 255, 0.44);
		--text-faint: rgba(255, 255, 255, 0.32);
		--text-ghost: rgba(255, 255, 255, 0.24);
		--border-color: rgba(255, 255, 255, 0.08);
		min-height: 100vh;
		background: var(--accent-color);
		color: var(--text-primary);
	}

	/* 亮色主题 */
	:global(.frontend-layout[data-theme="light"]) {
		--text-primary: rgba(0, 0, 0, 0.88);
		--text-secondary: rgba(0, 0, 0, 0.62);
		--text-muted: rgba(0, 0, 0, 0.38);
		--text-faint: rgba(0, 0, 0, 0.28);
		--text-ghost: rgba(0, 0, 0, 0.18);
		--border-color: rgba(0, 0, 0, 0.1);
	}

	.site-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		padding: 2.8rem 6rem;
		font-size: 1rem;
		letter-spacing: 0.42em;
		text-transform: uppercase;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: opacity 0.3s ease;
	}

	.site-header.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.site-logo {
		color: inherit;
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.site-logo:hover {
		opacity: 0.8;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
		letter-spacing: 0.22em;
	}

	.nav-link {
		color: var(--text-muted);
		text-decoration: none;
		font-weight: 700;
		transition: color 0.2s ease;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--text-primary);
	}
</style>
