<script lang="ts">
	import SiteNavbar from '$lib/components/SiteNavbar.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SiteBg from '$lib/components/SiteBg.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.current.name} — SALT X</title>
</svelte:head>

<div class="pr">
	<SiteBg />
	<SiteNavbar />

	<main class="mc">
		<!-- 左右切换箭头 -->
		{#if data.prev}
			<a href="/album/{data.prev.id}" class="sw sw-l" aria-label="上一张专辑">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M15 18l-6-6 6-6" />
				</svg>
				<span class="sw-name">{data.prev.name}</span>
			</a>
		{/if}
		{#if data.next}
			<a href="/album/{data.next.id}" class="sw sw-r" aria-label="下一张专辑">
				<span class="sw-name">{data.next.name}</span>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M9 18l6-6-6-6" />
				</svg>
			</a>
		{/if}

		<div class="lp">
			<!-- 左：封面 -->
			<div class="lc">
				<div class="cv">
					<div class="cv-corner cv-tl"></div>
					<div class="cv-corner cv-tr"></div>
					<div class="cv-corner cv-bl"></div>
					<div class="cv-corner cv-br"></div>
					{#if data.current.cover_file_key}
						<img src="/files/{data.current.cover_file_key}" alt={data.current.name} />
					{:else}
						<div class="cv-ph">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
								<circle cx="12" cy="12" r="10" />
								<circle cx="12" cy="12" r="3" />
								<circle cx="12" cy="12" r="6.5" stroke-dasharray="2 3" />
							</svg>
						</div>
					{/if}
				</div>

			</div>

			<!-- 右：信息 -->
			<div class="rp">
				<div class="at">
					<h1 class="an">{data.current.name}</h1>
					{#if data.current.artist}
						<p class="aa">{data.current.artist}</p>
					{/if}
				</div>

				{#if data.current.description}
					<p class="ad">{data.current.description}</p>
				{/if}

				<!-- 曲目数 -->
				<div class="tc">
					<span class="tc-num">{data.tracks.length}</span>
					<span class="tc-label">TRACKS</span>
				</div>

				<!-- PLAY 按钮 -->
				<a href="/album/{data.current.id}/play" class="pb">
					<span class="pb-text">PLAY</span>
				</a>

				<!-- 曲目预览 -->
				{#if data.tracks.length > 0}
					<ul class="tl">
						{#each data.tracks as track, i (track.id)}
							<li class="ti">
								<span class="ti-n">{String(i + 1).padStart(2, '0')}</span>
								<span class="ti-name">{track.name}</span>
								{#if track.version && track.version !== 'original'}
									<span class="ti-ver">{track.version}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
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
	.mc {
		max-width: 1440px;
		width: 100%;
		margin: 0 auto;
		padding: 7rem 5rem 5rem;
		position: relative;
		z-index: 1;
		flex: 1;
	}

	/* 切换箭头 */
	.sw {
		position: fixed;
		top: 50%;
		transform: translateY(-50%);
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.2);
		text-decoration: none;
		padding: 1rem 0.75rem;
		transition: color 0.25s, border-color 0.25s, background 0.25s;
		border: 1px solid transparent;
	}
	.sw:hover {
		color: rgba(255, 255, 255, 0.85);
		border-color: rgba(56, 182, 255, 0.2);
		background: rgba(56, 182, 255, 0.04);
	}
	.sw-l { left: 1.5rem; }
	.sw-r { right: 1.5rem; }
	.sw-name {
		font-size: 0.58rem;
		letter-spacing: 0.08em;
		writing-mode: vertical-rl;
		max-height: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* 主布局 */
	.lp {
		display: flex;
		gap: 5rem;
		align-items: flex-start;
	}

	/* 左：封面 */
	.lc {
		flex: 0 0 400px;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		position: sticky;
		top: 7rem;
	}
	.cv {
		position: relative;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: #0d0d1c;
	}
	.cv img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.cv-ph {
		width: 100%; height: 100%;
		display: flex; align-items: center; justify-content: center;
		color: rgba(255, 255, 255, 0.08);
	}
	.cv-ph svg { width: 50%; height: 50%; }
	.cv-corner {
		position: absolute;
		width: 16px; height: 16px;
		z-index: 2; pointer-events: none;
	}
	.cv-tl { top: -1px; left: -1px; border-top: 1px solid #38b6ff; border-left: 1px solid #38b6ff; }
	.cv-tr { top: -1px; right: -1px; border-top: 1px solid #38b6ff; border-right: 1px solid #38b6ff; }
	.cv-bl { bottom: -1px; left: -1px; border-bottom: 1px solid #38b6ff; border-left: 1px solid #38b6ff; }
	.cv-br { bottom: -1px; right: -1px; border-bottom: 1px solid #38b6ff; border-right: 1px solid #38b6ff; }
	/* 右：信息 */
	.rp {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-top: 0.5rem;
	}
	.at { display: flex; flex-direction: column; gap: 0.4rem; }
	.an {
		font-size: 2.4rem;
		font-weight: 200;
		letter-spacing: 0.08em;
		color: rgba(255,255,255,0.92);
		margin: 0;
		line-height: 1.15;
	}
	.aa {
		font-size: 0.82rem;
		color: rgba(255,255,255,0.38);
		letter-spacing: 0.18em;
		margin: 0;
	}
	.ad {
		font-size: 0.8rem;
		color: rgba(255,255,255,0.35);
		letter-spacing: 0.06em;
		line-height: 1.9;
		margin: 0;
		border-left: 1px solid rgba(56,182,255,0.2);
		padding-left: 1rem;
		max-width: 520px;
	}

	/* 曲目数 */
	.tc { display: flex; align-items: baseline; gap: 0.4rem; }
	.tc-num { font-size: 1.8rem; font-weight: 100; color: rgba(255,255,255,0.15); letter-spacing: 0.02em; }
	.tc-label { font-size: 0.58rem; letter-spacing: 0.4em; color: rgba(255,255,255,0.2); }

	/* PLAY 按钮 */
	.pb {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(56,182,255,0.35);
		background: rgba(56,182,255,0.04);
		color: #38b6ff;
		padding: 0.85rem 2rem;
		font-size: 0.78rem;
		letter-spacing: 0.5em;
		text-decoration: none;
		transition: background 0.25s, border-color 0.25s, color 0.25s, transform 0.25s;
		align-self: flex-start;
	}
	.pb:hover {
		background: rgba(56,182,255,0.1);
		border-color: rgba(56,182,255,0.7);
		color: #fff;
		transform: translateX(4px);
	}
	.pb-text { font-family: inherit; }

	/* 曲目预览列表 */
	.tl {
		list-style: none;
		margin: 0; padding: 0;
		display: flex; flex-direction: column;
		border-top: 1px solid rgba(255,255,255,0.06);
	}
	.ti {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.55rem 0.5rem;
		border-bottom: 1px solid rgba(255,255,255,0.04);
		color: rgba(255,255,255,0.3);
		transition: color 0.15s, box-shadow 0.15s;
	}
	.ti:hover { color: rgba(255,255,255,0.6); box-shadow: inset 3px 0 0 rgba(56,182,255,0.35); }
	.ti-n {
		font-size: 0.6rem;
		letter-spacing: 0.04em;
		min-width: 1.8em;
		text-align: right;
		flex-shrink: 0;
	}
	.ti-name {
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ti-ver {
		font-size: 0.58rem;
		color: rgba(56,182,255,0.4);
		letter-spacing: 0.08em;
		border: 1px solid rgba(56,182,255,0.15);
		padding: 0.1em 0.35em;
		flex-shrink: 0;
	}

	@media (max-width: 960px) {
		.mc { padding: 6rem 2rem 4rem; }
		.lp { flex-direction: column; gap: 2.5rem; }
		.lc { flex: none; width: 100%; max-width: 340px; position: static; }
		.sw { display: none; }
	}
	@media (max-width: 640px) {
		.mc { padding: 5.5rem 1.25rem 3rem; }
		.an { font-size: 1.7rem; }
	}
</style>
