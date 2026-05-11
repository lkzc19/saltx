<script lang="ts">
	import { playerStore } from '$lib/stores/player';
</script>

<header class="nb">
	<div class="nb-in">
		<a href="/" class="nb-logo">SALT<em>X</em></a>
		<nav class="nb-r" aria-label="主导航">
			<button class="nb-link">音乐</button>
			<button class="nb-login">登录</button>
		</nav>
	</div>
</header>

<style>
	.nb {
		position: fixed;
		top: 0; left: 0; right: 0;
		z-index: 50;
		background: rgba(7, 7, 15, 0.85);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}
	.nb-in {
		max-width: 1440px;
		margin: 0 auto;
		padding: 0 3rem;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.nb-logo {
		font-size: 0.8rem;
		font-weight: 300;
		letter-spacing: 0.35em;
		color: rgba(255, 255, 255, 0.9);
		text-decoration: none;
	}
	.nb-logo em {
		color: #38b6ff;
		font-style: normal;
	}
	.nb-r {
		display: flex;
		align-items: center;
		gap: 2.25rem;
	}
	.nb-link {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.38);
		letter-spacing: 0.15em;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		transition: color 0.2s;
	}
	.nb-link:hover { color: rgba(255, 255, 255, 0.9); }
	.nb-login {
		font-size: 0.72rem;
		letter-spacing: 0.15em;
		color: rgba(255, 255, 255, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.18);
		padding: 0.35rem 1rem;
		background: transparent;
		cursor: pointer;
		font-family: inherit;
		transition: color 0.2s, border-color 0.2s;
	}
	.nb-login:hover {
		color: rgba(255, 255, 255, 0.9);
		border-color: rgba(255, 255, 255, 0.4);
	}
	@media (max-width: 768px) {
		.nb-in { padding: 0 1.5rem; }
	}
</style>