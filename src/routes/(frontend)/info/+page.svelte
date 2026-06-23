<script lang="ts">
	import { getR2Url } from '$lib/utils/music';
	import { Accordion } from 'bits-ui';
	import { ChevronDown } from '@lucide/svelte';
	import NavigateBeforeIcon from '@iconify-svelte/material-symbols-light/navigate-before';
	import NavigateNextIcon from '@iconify-svelte/material-symbols-light/navigate-next';

	let { data } = $props();

	let currentSlide = $state(0);
	const announcements = $derived(data.items.filter((a) => a.cover_file_key));

	function nextSlide() {
		if (announcements.length === 0) return;
		currentSlide = (currentSlide + 1) % announcements.length;
	}

	function prevSlide() {
		if (announcements.length === 0) return;
		currentSlide = (currentSlide - 1 + announcements.length) % announcements.length;
	}
</script>

<svelte:head>
	<title>动向 - SALT X</title>
</svelte:head>

<div class="about-page">
	<main>
		<div class="about-content">
			<!-- 左侧轮播图 -->
			<div class="carousel-section">
				{#if announcements.length > 0}
					{@const currentItem = announcements[currentSlide]}
					<div class="carousel-header-wrapper">
						<div class="carousel-header-text"></div>
					</div>
					<div class="carousel-wrapper">
						<div class="carousel">
							<div class="carousel-inner" style:transform="translateX(-{currentSlide * 100}%)">
								{#each announcements as item (item.id)}
									<div class="carousel-slide">
										<img src={getR2Url(item.cover_file_key!)} alt={item.title} />
									</div>
								{/each}
							</div>
							{#if announcements.length > 1}
								<button class="carousel-btn prev" onclick={prevSlide} aria-label="上一张">
									<NavigateBeforeIcon class="h-24 w-24" />
								</button>
								<button class="carousel-btn next" onclick={nextSlide} aria-label="下一张">
									<NavigateNextIcon class="h-24 w-24" />
								</button>
							{/if}
						</div>
						<div class="carousel-corner top-left"></div>
						<div class="carousel-corner top-right"></div>
						<div class="carousel-corner bottom-left"></div>
						<div class="carousel-corner bottom-right"></div>
					</div>
					{#if announcements.length > 1}
						<div class="carousel-dots">
							{#each announcements as _, i (i)}
								<button
									class="dot"
									class:active={i === currentSlide}
									onclick={() => (currentSlide = i)}
									aria-label="跳转到第 {i + 1} 张"
								></button>
							{/each}
						</div>
					{/if}
					<div class="carousel-info">
						<h3 class="carousel-title">{currentItem.title}</h3>
						{#if currentItem.content}
							<p class="carousel-content">{currentItem.content}</p>
						{/if}
					</div>
				{:else}
					<div class="carousel-empty">
						<p>暂无公告</p>
					</div>
				{/if}
			</div>

			<!-- 右侧手风琴 -->
			<div class="accordion-section">
				<Accordion.Root type="single" class="accordion-root">
					{#each data.items as item (item.id)}
						<Accordion.Item value={item.id} class="accordion-item">
							<Accordion.Header class="accordion-header">
								<Accordion.Trigger class="accordion-trigger">
									<span>{item.title}</span>
									<ChevronDown class="accordion-chevron h-4 w-4" />
								</Accordion.Trigger>
							</Accordion.Header>
							<Accordion.Content class="accordion-content">
								{#if item.content}
									<p class="whitespace-pre-wrap">{item.content}</p>
								{:else}
									<p class="text-text-disabled">暂无内容</p>
								{/if}
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</div>
		</div>
	</main>
</div>

<style>
	.about-page {
		--accent-color: #243042;
		--text-primary: rgba(255, 255, 255, 0.94);
		--text-secondary: rgba(255, 255, 255, 0.68);
		--text-muted: rgba(255, 255, 255, 0.44);
		--border-color: rgba(255, 255, 255, 0.08);
		min-height: 100vh;
		background: var(--accent-color);
		color: var(--text-primary);
	}

	main {
		min-height: 100vh;
		padding: 8rem 6rem 4rem;
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.about-content {
		width: 100%;
		max-width: 1100px;
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: 5rem;
	}

	/* 轮播图样式 */
	.carousel-section {
		position: sticky;
		top: 8rem;
	}

	.carousel-wrapper {
		position: relative;
		z-index: 2;
	}

	.carousel {
		position: relative;
		width: 560px;
		height: 315px;
		overflow: hidden;
		border: 1px solid var(--border-color);
	}

	.carousel-corner {
		position: absolute;
		width: 10px;
		height: 10px;
		background: rgba(255, 255, 255, 0.8);
		pointer-events: none;
	}

	.carousel-corner.top-left {
		top: -10px;
		left: -10px;
	}

	.carousel-corner.top-right {
		top: -10px;
		right: -10px;
	}

	.carousel-corner.bottom-left {
		bottom: -10px;
		left: -10px;
	}

	.carousel-corner.bottom-right {
		bottom: -10px;
		right: -10px;
	}

	.carousel-inner {
		display: flex;
		height: 100%;
		transition: transform 0.5s ease;
	}

	.carousel-slide {
		min-width: 100%;
		position: relative;
	}

	.carousel-slide {
		min-width: 100%;
		position: relative;
		overflow: hidden;
	}

	.carousel-slide img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.carousel:hover .carousel-slide img {
		transform: scale(1.15);
	}

	.carousel-header-wrapper {
		position: relative;
		width: 560px;
		overflow: hidden;
		z-index: 10;
		user-select: none;
	}

	.carousel-header-text {
		font-size: 3rem;
		font-weight: 900;
		line-height: 1;
		color: transparent;
		-webkit-text-stroke: 1px rgba(255, 255, 255, 0.5);
		letter-spacing: 0.1em;
		white-space: nowrap;
		text-align: center;
		margin: 0;
	}

	.carousel-header-text::before,
	.carousel-header-text::after {
		content: "给生活加点盐";
		display: inline-block;
		width: 560px;
		animation: scroll-left 8s linear infinite;
		will-change: transform;
	}

	@keyframes scroll-left {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-100%);
		}
	}

	.carousel-wrapper {
		position: relative;
		z-index: 2;
	}

	.carousel-btn {
		position: absolute;
		top: 0;
		width: 20%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		border: none;
		cursor: pointer;
		background: transparent;
		opacity: 0;
		transition: background 0.2s ease, opacity 0.2s ease;
	}

	.carousel-btn:hover {
		opacity: 1;
	}

	.carousel-btn.prev {
		left: 0;
	}

	.carousel-btn.prev:hover {
		background: linear-gradient(to right, rgba(0, 0, 0, 0.7), transparent);
	}

	.carousel-btn.next {
		right: 0;
	}

	.carousel-btn.next:hover {
		background: linear-gradient(to left, rgba(0, 0, 0, 0.7), transparent);
	}

	.carousel-dots {
		display: flex;
		justify-content: center;
		gap: 0.65rem;
		margin-top: 1rem;
	}

	.dot {
		width: 0.65rem;
		height: 0.65rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.3);
		cursor: pointer;
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	.dot:not(.active):hover {
		border-color: white;
		background: white;
	}

	.dot.active {
		border-color: white;
		border-width: 1.5px;
		background: rgba(255, 255, 255, 0.3);
	}

	.carousel-info {
		margin-top: 1.5rem;
	}

	.carousel-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		color: var(--text-primary);
	}

	.carousel-content {
		font-size: 1.1rem;
		line-height: 1.7;
		color: var(--text-secondary);
		margin: 0;
		white-space: pre-wrap;
	}

	.carousel-empty {
		aspect-ratio: 16/9;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border-color);
		border-radius: 0.5rem;
		color: var(--text-muted);
	}

	/* 手风琴样式 */
	.accordion-section {
		padding-top: 1rem;
	}

	:global(.accordion-root) {
		width: 100%;
	}

	:global(.accordion-item) {
		border-bottom: 1px solid var(--border-color);
	}

	:global(.accordion-header) {
		margin: 0;
	}

	:global(.accordion-trigger) {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.2rem 0;
		background: none;
		border: none;
		color: var(--text-primary);
		font-size: 1rem;
		cursor: pointer;
		text-align: left;
		transition: color 0.2s ease;
	}

	:global(.accordion-trigger:hover) {
		color: var(--text-secondary);
	}

	:global(.accordion-trigger[data-state="open"] .accordion-chevron) {
		transform: rotate(180deg);
	}

	:global(.accordion-chevron) {
		transition: transform 0.2s ease;
		color: var(--text-muted);
	}

	:global(.accordion-content) {
		padding-bottom: 1.2rem;
		color: var(--text-secondary);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	:global(.accordion-content[data-state="open"]) {
		animation: slideDown 0.2s ease;
	}

	:global(.accordion-content[data-state="closed"]) {
		animation: slideUp 0.2s ease;
	}

	@keyframes slideDown {
		from {
			height: 0;
			opacity: 0;
		}
		to {
			height: var(--bits-accordion-content-height);
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			height: var(--bits-accordion-content-height);
			opacity: 1;
		}
		to {
			height: 0;
			opacity: 0;
		}
	}

	@media (max-width: 768px) {
		main {
			padding: 6rem 1.5rem 2rem;
		}

		.about-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.carousel-section {
			position: static;
		}
	}
</style>
