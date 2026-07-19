export interface ColorScheme {
	id: string;
	name: string;
	primary: string;
	colors: string[];
}

export const colorSchemes: ColorScheme[] = [
	{
		id: 'blue',
		name: 'Blue',
		primary: 'oklch(0.55 0.2 250)',
		colors: [
			'oklch(0.55 0.2 250)',
			'oklch(0.7 0.15 200)',
			'oklch(0.6 0.18 300)',
			'oklch(0.75 0.12 160)',
			'oklch(0.5 0.22 280)'
		]
	},
	{
		id: 'sunset',
		name: 'Sunset',
		primary: 'oklch(0.65 0.2 40)',
		colors: [
			'oklch(0.65 0.2 40)',
			'oklch(0.7 0.18 20)',
			'oklch(0.6 0.22 60)',
			'oklch(0.75 0.15 80)',
			'oklch(0.55 0.24 10)'
		]
	},
	{
		id: 'forest',
		name: 'Forest',
		primary: 'oklch(0.55 0.15 150)',
		colors: [
			'oklch(0.55 0.15 150)',
			'oklch(0.65 0.12 130)',
			'oklch(0.45 0.1 170)',
			'oklch(0.7 0.14 110)',
			'oklch(0.5 0.16 190)'
		]
	},
	{
		id: 'purple',
		name: 'Purple',
		primary: '#7C3AED',
		colors: ['#7C3AED', '#DB2777', '#D97706', '#0284C7', '#059669']
	},
	{
		id: 'mint',
		name: 'Mint',
		primary: '#059669',
		colors: ['#059669', '#7C3AED', '#D97706', '#0284C7', '#DB2777']
	},
	{
		id: 'glass',
		name: 'Glass',
		primary: '#0D9488',
		colors: ['#0D9488', '#EC4899', '#D97706', '#3B82F6', '#C026D3']
	},
	{
		id: 'grayscale',
		name: 'Grayscale',
		primary: 'oklch(0.4 0 0)',
		colors: [
			'oklch(0.3 0 0)',
			'oklch(0.45 0 0)',
			'oklch(0.6 0 0)',
			'oklch(0.75 0 0)',
			'oklch(0.85 0 0)'
		]
	}
];

export function getColorScheme(id: string): ColorScheme {
	return colorSchemes.find((scheme) => scheme.id === id) ?? colorSchemes[0];
}
