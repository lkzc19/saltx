type Rgb = [number, number, number];

const DEFAULT_BACKGROUND_COLOR = '#243042';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
	const red = r / 255;
	const green = g / 255;
	const blue = b / 255;
	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const lightness = (max + min) / 2;

	if (max === min) return [0, 0, lightness];

	const delta = max - min;
	const saturation =
		lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

	let hue = 0;
	switch (max) {
		case red:
			hue = (green - blue) / delta + (green < blue ? 6 : 0);
			break;
		case green:
			hue = (blue - red) / delta + 2;
			break;
		default:
			hue = (red - green) / delta + 4;
			break;
	}

	return [hue / 6, saturation, lightness];
}

function hueToRgb(p: number, q: number, t: number): number {
	let next = t;
	if (next < 0) next += 1;
	if (next > 1) next -= 1;
	if (next < 1 / 6) return p + (q - p) * 6 * next;
	if (next < 1 / 2) return q;
	if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
	return p;
}

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
	if (saturation === 0) {
		const gray = Math.round(lightness * 255);
		return [gray, gray, gray];
	}

	const q =
		lightness < 0.5
			? lightness * (1 + saturation)
			: lightness + saturation - lightness * saturation;
	const p = 2 * lightness - q;

	return [
		Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
		Math.round(hueToRgb(p, q, hue) * 255),
		Math.round(hueToRgb(p, q, hue - 1 / 3) * 255)
	];
}

function rgbToHex([r, g, b]: Rgb): string {
	return `#${[r, g, b]
		.map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
		.join('')}`.toUpperCase();
}

function squaredDistance(a: Rgb, b: Rgb): number {
	const dr = a[0] - b[0];
	const dg = a[1] - b[1];
	const db = a[2] - b[2];
	return dr * dr + dg * dg + db * db;
}

function samplePixels(canvas: HTMLCanvasElement, maxSamples = 4096): Rgb[] {
	const ctx = canvas.getContext('2d');
	if (!ctx) return [];

	const { width, height } = canvas;
	const data = ctx.getImageData(0, 0, width, height).data;
	const totalPixels = width * height;
	const stride = Math.max(1, Math.floor(Math.sqrt(totalPixels / maxSamples)));
	const pixels: Rgb[] = [];

	for (let y = 0; y < height; y += stride) {
		for (let x = 0; x < width; x += stride) {
			const index = (y * width + x) * 4;
			const alpha = data[index + 3];
			if (alpha < 32) continue;
			pixels.push([data[index], data[index + 1], data[index + 2]]);
		}
	}

	return pixels;
}

function extractDominantColor(pixels: Rgb[], clusterCount = 5, iterations = 6): Rgb | null {
	if (pixels.length === 0) return null;

	const k = Math.min(clusterCount, pixels.length);
	const centroids: Rgb[] = Array.from({ length: k }, (_, index) => {
		const sampleIndex = Math.floor((index * pixels.length) / k);
		return [...pixels[sampleIndex]] as Rgb;
	});

	const assignments = new Array<number>(pixels.length).fill(0);

	for (let iteration = 0; iteration < iterations; iteration += 1) {
		for (let i = 0; i < pixels.length; i += 1) {
			let nearestIndex = 0;
			let nearestDistance = Number.POSITIVE_INFINITY;

			for (let centroidIndex = 0; centroidIndex < centroids.length; centroidIndex += 1) {
				const distance = squaredDistance(pixels[i], centroids[centroidIndex]);
				if (distance < nearestDistance) {
					nearestDistance = distance;
					nearestIndex = centroidIndex;
				}
			}

			assignments[i] = nearestIndex;
		}

		const sums = Array.from({ length: k }, () => [0, 0, 0] as Rgb);
		const counts = new Array<number>(k).fill(0);

		for (let i = 0; i < pixels.length; i += 1) {
			const clusterIndex = assignments[i];
			sums[clusterIndex][0] += pixels[i][0];
			sums[clusterIndex][1] += pixels[i][1];
			sums[clusterIndex][2] += pixels[i][2];
			counts[clusterIndex] += 1;
		}

		for (let i = 0; i < k; i += 1) {
			if (counts[i] === 0) continue;
			centroids[i] = [
				Math.round(sums[i][0] / counts[i]),
				Math.round(sums[i][1] / counts[i]),
				Math.round(sums[i][2] / counts[i])
			];
		}
	}

	const clusterSizes = new Array<number>(k).fill(0);
	for (const assignment of assignments) clusterSizes[assignment] += 1;

	let dominantIndex = 0;
	for (let i = 1; i < clusterSizes.length; i += 1) {
		if (clusterSizes[i] > clusterSizes[dominantIndex]) dominantIndex = i;
	}

	return centroids[dominantIndex];
}

function adaptColorForBackground(rgb: Rgb): string {
	const [hue, saturation, lightness] = rgbToHsl(rgb);
	const adjustedSaturation = clamp(saturation * 0.72, 0.08, 0.45);
	const adjustedLightness =
		lightness > 0.55
			? clamp(lightness - 0.18, 0.2, 0.42)
			: clamp(lightness + 0.12, 0.2, 0.42);

	return rgbToHex(hslToRgb(hue, adjustedSaturation, adjustedLightness));
}

export function getMatchingBackgroundColor(canvas: HTMLCanvasElement): string {
	const pixels = samplePixels(canvas);
	const dominantColor = extractDominantColor(pixels);
	if (!dominantColor) return DEFAULT_BACKGROUND_COLOR;
	return adaptColorForBackground(dominantColor);
}
