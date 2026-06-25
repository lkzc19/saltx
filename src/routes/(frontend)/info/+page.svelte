<script lang="ts">
	import { getR2Url } from '$lib/utils/music';
	import NavigateBeforeIcon from '@iconify-svelte/material-symbols-light/navigate-before';
	import NavigateNextIcon from '@iconify-svelte/material-symbols-light/navigate-next';

	let { data } = $props();

	let currentSlide = $state(0);
	const announcements = $derived((data.featured ?? []).filter((a) => a.cover_file_key));

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

			<!-- 右侧列表 -->
			<div class="list-section">
				{#each (data.allItems ?? []) as item (item.id)}
					<div class="list-item">
						<div class="list-item-meta">
							<span class="list-item-tag">{item.category}</span>
							<span class="list-item-sep">/</span>
							<span class="list-item-date">{item.created_at.slice(0, 4)}.{item.created_at.slice(5, 7)}.{item.created_at.slice(8, 10)}</span>
						</div>
						<h3 class="list-item-title"># {item.title}</h3>
					</div>
				{/each}
				{#if (data.allItems ?? []).length === 0}
					<p class="list-empty">暂无动向</p>
				{/if}
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
		height: 3.375rem;
		overflow: hidden;
		z-index: 10;
		user-select: none;
	}

	.carousel-header-text {
		font-size: 4.5rem;
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

	/* 列表样式 */
	.list-section {
		display: flex;
		flex-direction: column;
		padding-top: 1rem;
	}

	.list-item {
		padding: 1.5rem 0;
		border-bottom: 1px solid var(--border-color);
		transition: opacity 0.2s ease;
		list-style: none;
	}

	.list-item:last-child {
		border-bottom: none;
	}

	.list-item:hover .list-item-tag,
	.list-item:hover .list-item-sep,
	.list-item:hover .list-item-date {
		color: rgba(255, 255, 255, 0.7);
	}

	.list-item-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.list-item-tag {
		font-size: 1.125rem;
		font-weight: 300;
		color: var(--text-muted);
		letter-spacing: 0.05em;
		text-transform: uppercase;
		list-style: none;
		font-family: "SF Pro Display", "Inter", "PingFang SC", "Helvetica Neue", sans-serif;
	}

	.list-item-sep {
		font-size: 1.125rem;
		color: var(--text-muted);
		font-family: "SF Pro Display", "Inter", "PingFang SC", "Helvetica Neue", sans-serif;
		font-weight: 300;
	}

	.list-item-date {
		font-size: 1.125rem;
		color: var(--text-muted);
		font-family: "SF Pro Display", "Inter", "PingFang SC", "Helvetica Neue", sans-serif;
		font-weight: 300;
	}

	.list-item-title {
		font-size: 1.75rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.4;
		margin: 0;
		transition: color 0.2s ease;
	}

	.list-item:hover .list-item-title {
		color: rgba(255, 255, 255, 1);
	}

	.list-empty {
		padding: 2rem 0;
		font-size: 0.875rem;
		color: var(--text-muted);
		text-align: center;
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
