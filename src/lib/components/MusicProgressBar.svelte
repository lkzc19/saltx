<script lang="ts">
	import { playerState, requestSeek } from '$lib/stores/admin.svelte';

	let barEl = $state<HTMLElement | undefined>(undefined);
	let isDragging = $state(false);
	let previewRatio = $state<number | null>(null);

	let track = $derived($playerState.currentTrack);
	let duration = $derived($playerState.duration);
	let currentTime = $derived($playerState.currentTime);

	let displayRatio = $derived(
		previewRatio !== null ? previewRatio : duration > 0 ? currentTime / duration : 0
	);

	function formatTime(s: number): string {
		if (!isFinite(s) || s < 0) return '0:00';
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	function getRatio(e: MouseEvent): number {
		if (!barEl) return 0;
		const rect = barEl.getBoundingClientRect();
		return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
	}

	function handleMouseDown(e: MouseEvent) {
		if (!duration) return;
		e.preventDefault();
		isDragging = true;
		previewRatio = getRatio(e);

		const onMove = (e: MouseEvent) => {
			previewRatio = getRatio(e);
		};
		const onUp = (e: MouseEvent) => {
			requestSeek(getRatio(e) * duration);
			isDragging = false;
			previewRatio = null;
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
		};

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}
</script>

{#if track}
	<div class="flex h-16 items-center border-t border-border bg-bg-card px-6">
		<div class="flex w-full items-center gap-3">
			<span class="w-10 text-right font-mono text-xs tabular-nums text-text-disabled">
				{formatTime(currentTime)}
			</span>

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={barEl}
				class="group relative flex h-5 flex-1 cursor-pointer items-center"
				onmousedown={handleMouseDown}
			>
				<!-- 轨道 -->
				<div class="h-1.5 w-full rounded-full bg-border">
					<div
						class="h-full rounded-full bg-primary"
						class:transition-none={isDragging}
						class:transition-[width]={!isDragging}
						style="width: {displayRatio * 100}%"
					></div>
				</div>
				<!-- 拖拽圆点 -->
				<div
					class="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow transition-opacity"
					class:opacity-100={isDragging}
					class:opacity-0={!isDragging}
					class:group-hover:opacity-100={!isDragging}
					style="left: {displayRatio * 100}%"
				></div>
			</div>

			<span class="w-10 font-mono text-xs tabular-nums text-text-disabled">
				{formatTime(duration)}
			</span>
		</div>
	</div>
{/if}
