import { downloadBlob } from '$lib/query/download';

const SVG_PROPS = [
	'fill',
	'stroke',
	'stroke-width',
	'stroke-dasharray',
	'stroke-linecap',
	'opacity',
	'font-size',
	'font-family',
	'font-weight',
	'text-anchor',
	'color'
] as const;

/** Clones an SVG with computed styles inlined so it renders standalone. */
export function inlineSvg(svg: SVGSVGElement): SVGSVGElement {
	const clone = svg.cloneNode(true) as SVGSVGElement;
	const originals = [svg, ...svg.querySelectorAll('*')];
	const clones = [clone, ...clone.querySelectorAll('*')];
	for (let i = 0; i < originals.length; i++) {
		const computed = getComputedStyle(originals[i]);
		for (const prop of SVG_PROPS) {
			const value = computed.getPropertyValue(prop);
			if (value && value !== 'none' && value !== 'normal') {
				(clones[i] as SVGElement).style.setProperty(prop, value);
			}
		}
	}
	clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	const rect = svg.getBoundingClientRect();
	clone.setAttribute('width', String(Math.max(1, Math.round(rect.width))));
	clone.setAttribute('height', String(Math.max(1, Math.round(rect.height))));
	return clone;
}

function findWidgetSvg(widgetId: string): SVGSVGElement | null {
	return document.querySelector<SVGSVGElement>(`[data-widget-id="${widgetId}"] svg`);
}

export function exportWidgetSvg(widgetId: string, name: string): boolean {
	const svg = findWidgetSvg(widgetId);
	if (!svg) return false;
	const markup = new XMLSerializer().serializeToString(inlineSvg(svg));
	downloadBlob(`${name}.svg`, 'image/svg+xml', markup);
	return true;
}

export async function exportWidgetPng(widgetId: string, name: string): Promise<boolean> {
	const svg = findWidgetSvg(widgetId);
	if (!svg) return false;
	const rect = svg.getBoundingClientRect();
	const markup = new XMLSerializer().serializeToString(inlineSvg(svg));
	const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
	try {
		const image = new Image();
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error('Could not rasterize the chart.'));
			image.src = url;
		});
		const scale = 2;
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(rect.width * scale));
		canvas.height = Math.max(1, Math.round(rect.height * scale));
		const context = canvas.getContext('2d');
		if (!context) return false;
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/png')
		);
		if (!blob) return false;
		downloadBlob(`${name}.png`, 'image/png', blob);
		return true;
	} finally {
		URL.revokeObjectURL(url);
	}
}
