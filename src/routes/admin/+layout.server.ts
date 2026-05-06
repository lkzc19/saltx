import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform }) => ({
	r2PublicUrl: platform?.env.R2_PUBLIC_URL ?? ''
});