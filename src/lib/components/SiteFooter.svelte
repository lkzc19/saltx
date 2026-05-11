<footer class="sf">
	<div class="sf-scroll" aria-hidden="true">
		<span class="sf-stxt">SCROLL</span>
		<svg width="12" height="18" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M6 2v12M1 10l5 6 5-6" />
		</svg>
	</div>
</footer>

<style>
	.sf {
		position: relative;
		z-index: 1;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		padding: 2.5rem 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.sf-tag {
		font-size: 0.7rem;
		font-weight: 300;
		letter-spacing: 0.45em;
		color: rgba(255, 255, 255, 0.2);
		margin: 0;
		text-align: center;
	}
	.sf-scroll {
		position: absolute;
		right: 3rem;
		bottom: 1.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		color: rgba(255, 255, 255, 0.2);
		animation: sf-bounce 2s ease-in-out infinite;
	}
	.sf-stxt {
		font-size: 0.58rem;
		letter-spacing: 0.35em;
	}
	@keyframes sf-bounce {
		0%, 100% { transform: translateY(0); opacity: 0.2; }
		50% { transform: translateY(4px); opacity: 0.45; }
	}
	@media (max-width: 768px) {
		.sf { padding: 2rem 1.5rem; }
		.sf-scroll { right: 1.5rem; }
	}
</style>
