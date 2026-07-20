import { downloadBlob } from '$lib/query/download';
import { inlineSvg } from './image';

const BASE_CSS = `
	* { box-sizing: border-box; margin: 0; }
	body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f6f6f7; color: #262626; }
	.canvas { position: relative; margin: 0 auto; }
	.widget { position: absolute; background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
	.widget-title { font-size: 13px; font-weight: 500; padding: 4px 8px; border-bottom: 1px solid #e5e5e5; }
	.widget-body { flex: 1; overflow: auto; padding: 8px; font-size: 12px; }
	table { border-collapse: collapse; width: 100%; font-size: 11px; }
	th, td { border-bottom: 1px solid #eee; padding: 3px 6px; text-align: left; white-space: nowrap; }
	svg { max-width: 100%; }
	button { all: unset; }
`;

/**
 * Snapshots the rendered dashboard into a single self-contained HTML file.
 * Charts are captured as inline SVG with styles baked in; no server needed.
 */
export function exportDashboardHtml(name: string): boolean {
	const canvas = document.querySelector<HTMLElement>('[data-dashboard-canvas]');
	if (!canvas) return false;
	const canvasRect = canvas.getBoundingClientRect();
	const shells = canvas.querySelectorAll<HTMLElement>('[data-widget-id]');
	if (shells.length === 0) return false;

	let body = '';
	let maxBottom = 400;
	for (const shell of shells) {
		const rect = shell.getBoundingClientRect();
		const left = rect.left - canvasRect.left;
		const top = rect.top - canvasRect.top;
		maxBottom = Math.max(maxBottom, top + rect.height);

		const clone = shell.cloneNode(true) as HTMLElement;
		const cloneSvgs = clone.querySelectorAll('svg');
		const liveSvgs = shell.querySelectorAll('svg');
		for (let i = 0; i < cloneSvgs.length; i++) {
			if (liveSvgs[i]) cloneSvgs[i].replaceWith(inlineSvg(liveSvgs[i] as SVGSVGElement));
		}
		const title = shell.dataset.widgetTitle ?? '';
		const chromeless = shell.dataset.widgetChromeless === 'true';
		const content = clone.querySelector<HTMLElement>('[data-widget-body]');
		body += `<div class="widget" style="left:${left}px;top:${top}px;width:${rect.width}px;height:${rect.height}px">`;
		if (!chromeless && title) body += `<div class="widget-title">${escapeHtml(title)}</div>`;
		body += `<div class="widget-body">${content?.innerHTML ?? ''}</div></div>`;
	}

	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(name)}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<div class="canvas" style="width:${canvasRect.width}px;height:${maxBottom + 40}px">
${body}
</div>
</body>
</html>`;

	const fileName = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-') || 'dashboard';
	downloadBlob(`${fileName}.html`, 'text/html', html);
	return true;
}

function escapeHtml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}
