<script lang="ts">
	import type { Album } from '$lib/types/music';
	import SiteNavbar from '$lib/components/SiteNavbar.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SiteBg from '$lib/components/SiteBg.svelte';

	let { data } = $props();

	let albums = $state<Album[]>([]);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let searchQuery = $state('');
	let loading = $state(false);

	$effect(() => {
		albums = data.items;
		currentPage = data.page;
		totalPages = data.totalPages;
	});

	const PAGE_SIZE = 10;

	async function loadPage(page: number, name = '') {
		loading = true;
		try {
			const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
			if (name) params.set('name', name);
			const res = await fetch(`/api/album/list?${params}`);
			if (res.ok) {
				const json = (await res.json()) as { items: Album[]; page: number; totalPages: number };
				albums = json.items;
				currentPage = json.page;
				totalPages = json.totalPages;
			}
		} finally {
			loading = false;
		}
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		loadPage(1, searchQuery);
	}

	function goToPage(p: number) {
		if (p < 1 || p > totalPages || p === currentPage || loading) return;
		loadPage(p, searchQuery);
	}
</script>

<svelte:head>
	<title>SALT X — 专辑陈列</title>
</svelte:head>

<div class="pr">
	<SiteBg />
	<SiteNavbar />

	<main class="mc">
		<!-- 搜索 + 标题行 -->
		<div class="sh">
			<form onsubmit={handleSearch} class="sf">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="搜索曲目"
					class="si"
					aria-label="搜索曲目"
				/>
				<button type="submit" class="sb" aria-label="搜索">
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
					</svg>
				</button>
			</form>

			<div class="st">
				<svg class="di" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
					<circle cx="12" cy="12" r="10" />
					<circle cx="12" cy="12" r="3" />
					<circle cx="12" cy="12" r="6.5" stroke-dasharray="2 3" />
				</svg>
				<h1 class="tt">专辑陈列</h1>
			</div>
		</div>

		<!-- 翻页按钮 -->
			{#if totalPages > 1}
				<button
					class="pb pb-prev"
					onclick={() => goToPage(currentPage > 1 ? currentPage - 1 : totalPages)}
					disabled={loading}
					aria-label="上一页"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</button>
				<button
					class="pb pb-next"
					onclick={() => goToPage(currentPage < totalPages ? currentPage + 1 : 1)}
					disabled={loading}
					aria-label="下一页"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M9 18l6-6-6-6" />
					</svg>
				</button>
			{/if}

			<!-- 专辑网格 -->
			<div class="ag" class:loading>
				{#if albums.length === 0}
					<div class="es">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
							<circle cx="12" cy="12" r="10" />
							<circle cx="12" cy="12" r="3" />
							<path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
						</svg>
						<p>暂无专辑</p>
					</div>
				{:else}
					{#each albums as album (album.id)}
						<a href="/album/{album.id}" class="ac">
							<div class="cc">
								{#if album.cover_file_key}
									<img src="/files/{album.cover_file_key}" alt={album.name} loading="lazy" />
								{:else}
									<div class="cp">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
											<circle cx="12" cy="12" r="10" />
											<circle cx="12" cy="12" r="3" />
											<circle cx="12" cy="12" r="6.5" stroke-dasharray="2 3" />
										</svg>
									</div>
								{/if}
							</div>
							<div class="ci">
								<p class="cn">{album.name}</p>
								{#if album.artist}<p class="ca">{album.artist}</p>{/if}
							</div>
						</a>
					{/each}
				{/if}
			</div>

		<!-- 分页指示器 -->
		{#if totalPages > 1}
			<div class="pg" role="navigation" aria-label="分页">
				{#each Array(totalPages) as _, i (i)}
					<button
						class="pd"
						class:active={currentPage === i + 1}
						onclick={() => goToPage(i + 1)}
						aria-label="第 {i + 1} 页"
						aria-current={currentPage === i + 1 ? 'page' : undefined}
					></button>
				{/each}
			</div>
		{/if}
	</main>

	<SiteFooter />
</div>

<style>
	.pr {
		min-height: 100vh;
		background-color: #07070f;
		position: relative;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
	}

	/* 主内容 */
	.mc {
		max-width: 1440px;
		width: 100%;
		margin: 0 auto;
		padding: 6rem 3rem 5rem;
		position: relative;
		z-index: 1;
		flex: 1;
	}

	/* 搜索 + 标题行 */
	.sh {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 3rem;
	}
	.sf {
		display: flex;
		align-items: center;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 2px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.03);
		transition: border-color 0.2s;
	}
	.sf:focus-within { border-color: rgba(56, 182, 255, 0.4); }
	.si {
		background: transparent;
		border: none;
		outline: none;
		padding: 0.6rem 1rem;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.7);
		letter-spacing: 0.08em;
		width: 220px;
		font-family: inherit;
	}
	.si::placeholder { color: rgba(255, 255, 255, 0.22); }
	.sb {
		background: transparent;
		border: none;
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		padding: 0.6rem 0.85rem;
		color: rgba(255, 255, 255, 0.3);
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: color 0.2s;
	}
	.sb:hover { color: rgba(255, 255, 255, 0.7); }
	.st { display: flex; align-items: center; gap: 0.75rem; }
	.di { width: 28px; height: 28px; color: rgba(255, 255, 255, 0.25); }
	.tt {
		font-size: 0.85rem;
		font-weight: 300;
		letter-spacing: 0.35em;
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
	}

	/* 专辑网格 */
	.ag {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 1rem;
		transition: opacity 0.3s;
	}
	.ag.loading { opacity: 0.4; pointer-events: none; }

	/* 1920px+ 大屏：6 列，加大间距 */
	@media (min-width: 1920px) {
		.mc { max-width: 1760px; padding: 7rem 4rem 6rem; }
		.ag { grid-template-columns: repeat(6, 1fr); gap: 1.25rem; }
	}
	/* 1440px–1919px：5 列（默认） */
	@media (min-width: 1280px) and (max-width: 1439px) {
		.mc { padding: 6rem 2.5rem 5rem; }
		.ag { grid-template-columns: repeat(5, 1fr); }
	}
	/* 1024px–1279px：4 列 */
	@media (min-width: 1025px) and (max-width: 1279px) {
		.mc { padding: 6rem 2rem 5rem; }
		.ag { grid-template-columns: repeat(4, 1fr); }
	}
	/* 768px–1024px：3 列 */
	@media (max-width: 1024px) { .ag { grid-template-columns: repeat(3, 1fr); } }
	/* 480px–767px：2 列 */
	@media (max-width: 640px) { .ag { grid-template-columns: repeat(2, 1fr); } }

	/* 翻页按钮 - 固定在左侧 logo 下方 */
	.pb {
		position: fixed;
		top: 50%;
		transform: translateY(-50%);
		width: 40px; height: 40px;
		border-radius: 50%;
		border: 1px solid rgba(255,255,255,.14);
		background: rgba(7,7,15,.85);
		backdrop-filter: blur(10px);
		color: rgba(255,255,255,.4);
		display: flex; align-items: center; justify-content: center;
		cursor: pointer;
		z-index: 20;
		transition: border-color 0.2s, color 0.2s, background 0.2s;
	}
	.pb-prev { left: 1.5rem; }
	.pb-next { right: 1.5rem; }
	@media (min-width: 1920px) {
		.pb-prev { left: 2.5rem; }
		.pb-next { right: 2.5rem; }
	}
	.pb:hover:not(:disabled) {
		border-color: rgba(56,182,255,.5);
		color: #38b6ff;
		background: rgba(56,182,255,.08);
	}
	.pb:disabled { opacity: 0.2; cursor: not-allowed; }

	/* 专辑卡片 */
	.ac {
		display: block;
		text-decoration: none;
		transition: transform 0.3s ease;
	}
	.ac:hover { transform: translateY(-5px); }
	.cc {
		position: relative;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: #0d0d1c;
		border: 1px solid rgba(255,255,255,0.07);
		transition: border-color 0.3s;
	}
	.ac:hover .cc { border-color: rgba(56,182,255,0.28); }
	.cc img {
		width: 100%; height: 100%;
		object-fit: cover; display: block;
		transition: transform 0.5s ease;
	}
	.ac:hover .cc img { transform: scale(1.04); }
	.cp {
		width: 100%; height: 100%;
		display: flex; align-items: center; justify-content: center;
		color: rgba(255,255,255,0.1);
	}
	.cp svg { width: 40%; height: 40%; }
	.ci { padding: 0.55rem 0.15rem 0; }
	.cn {
		font-size: 0.72rem;
		color: rgba(255,255,255,0.72);
		letter-spacing: 0.05em;
		margin: 0 0 0.18rem;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.ca {
		font-size: 0.6rem;
		color: rgba(255,255,255,0.28);
		letter-spacing: 0.06em;
		margin: 0;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.es {
		grid-column: 1 / -1;
		display: flex; flex-direction: column; align-items: center;
		gap: 1rem; padding: 5rem 0;
		color: rgba(255,255,255,.18);
	}
	.es p { font-size: 0.78rem; letter-spacing: 0.2em; }

	/* 分页指示器 - 固定位置 */
	.pg {
		position: absolute;
		bottom: 3rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex; align-items: center; justify-content: center;
		gap: 0.75rem;
	}
	.pd {
		width: 12px; height: 12px;
		border-radius: 0;
		border: 1px solid rgba(255,255,255,.4);
		background: transparent;
		cursor: pointer; padding: 0;
		transition: background 0.2s, border-color 0.2s;
	}
	.pd.active { background: #fff; border-color: #fff; }
	.pd:hover:not(.active) { border-color: rgba(255,255,255,.8); }

	@media (max-width: 768px) {
		.mc { padding: 5rem 1.5rem 4rem; }
		.sh { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
		.si { width: 160px; }
	}
</style>
