import type { ValueFormat } from '$lib/workflow/types';

export function toNumber(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value === 'bigint') return Number(value);
	const num = Number(value);
	return Number.isNaN(num) ? null : num;
}

/** Formats a numeric value for display. Percent expects fractions (0.42 → 42%). */
export function formatValue(value: unknown, format?: ValueFormat): string {
	if (value === null || value === undefined || value === '') return '—';
	const num = toNumber(value);
	if (num === null) return String(value);
	const decimals = format?.decimals;
	const digits =
		decimals !== undefined
			? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
			: { maximumFractionDigits: 2 };
	try {
		switch (format?.style) {
			case 'currency':
				return num.toLocaleString(undefined, {
					style: 'currency',
					currency: format.currency || 'USD',
					...digits
				});
			case 'percent':
				return num.toLocaleString(undefined, { style: 'percent', ...digits });
			case 'compact':
				return num.toLocaleString(undefined, { notation: 'compact', ...digits });
			case 'number':
				return num.toLocaleString(undefined, digits);
			default:
				return num.toLocaleString(undefined, digits);
		}
	} catch {
		return num.toLocaleString();
	}
}
