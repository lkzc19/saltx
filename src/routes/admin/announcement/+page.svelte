<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import AnnouncementTable from './_components/AnnouncementTable.svelte';
	import AnnouncementDetail from './_components/AnnouncementDetail.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Scrollbar from '$lib/components/Scrollbar.svelte';
	import { adminState } from '$lib/stores/admin.svelte';
	import type { Announcement } from '$lib/types/announcement';

	let { data } = $props();

	function handlePageChange(p: number, ps: number) {
		const sp = new SvelteURLSearchParams(page.url.searchParams);
		sp.set('page', String(p));
		if (ps !== data.pageSize) sp.set('pageSize', String(ps));
		goto(`${resolve('/admin/announcement', {})}?${sp.toString()}`);
	}

	function handleCreated(created: Announcement) {
		invalidateAll();
	}

	function handleSaved(updated: Announcement) {
		adminState.selectedAnnouncement = updated;
		invalidateAll();
	}

	function handleDeleted() {
		adminState.selectedAnnouncement = null;
		invalidateAll();
	}

	async function handleDelete(id: string) {
		if (!confirm('确定要删除这条公告吗？')) return;
		await fetch(`/api/admin/announcement?id=${id}`, { method: 'DELETE' });
		if (adminState.selectedAnnouncement?.id === id) {
			adminState.selectedAnnouncement = null;
		}
		invalidateAll();
	}

	async function handleTogglePin(id: string) {
		await fetch(`/api/admin/announcement/pin?id=${id}`, { method: 'PUT' });
		invalidateAll();
	}
</script>

<svelte:head>
	<title>公告管理 - SALT X</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1">
		<div class="flex min-w-0 flex-1 flex-col">
			<Scrollbar class="min-h-0 flex-1"><div class="p-4">
				<AnnouncementTable
					items={data.items}
					selectedId={adminState.selectedAnnouncement?.id ?? null}
					onselect={(item) => (adminState.selectedAnnouncement = item)}
					onadd={() => (adminState.addingAnnouncement = true)}
					ondelete={handleDelete}
					ontogglepin={handleTogglePin}
				/>
			</div>
			</Scrollbar>
			<div class="flex min-h-18 items-center border-t border-border-primary px-4">
				<Pagination
					page={data.page}
					pageSize={data.pageSize}
					total={data.total}
					totalPages={data.totalPages}
					onchange={handlePageChange}
				/>
			</div>
		</div>
		<AnnouncementDetail announcement={adminState.selectedAnnouncement} onsaved={handleSaved} oncreated={handleCreated} ondeleted={handleDeleted} />
	</div>
</div>
