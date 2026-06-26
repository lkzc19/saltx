export interface ColorEntry {
	color: string;
	algorithm: string;
}

export interface BgColors {
	auto: ColorEntry[];
	manual: string[];
	active: string;
}

export function parseBgColors(raw: string | null): BgColors {
	if (!raw) return { auto: [], manual: [], active: '' };
	try {
		return JSON.parse(raw);
	} catch {
		return { auto: [], manual: [], active: '' };
	}
}
