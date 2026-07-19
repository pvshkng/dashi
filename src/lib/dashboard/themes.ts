export interface DashboardTheme {
	id: string;
	name: string;
	description: string;
	mode: 'light' | 'dark';
	colorScheme: string;
	background: string;
	vars: Record<string, string>;
}

export const dashboardThemes: DashboardTheme[] = [
	{
		id: 'classic',
		name: 'Classic',
		description: 'The plain app look: flat cards on the app background.',
		mode: 'light',
		colorScheme: 'blue',
		background: '',
		vars: {}
	},
	{
		id: 'neo-purple',
		name: 'Lavender neumorphic',
		description: 'Soft raised cards on a lavender canvas with purple accents.',
		mode: 'light',
		colorScheme: 'purple',
		background:
			'radial-gradient(900px 500px at 85% -10%, rgb(221 214 254 / 0.5), transparent 60%), linear-gradient(160deg, #eceafd 0%, #e4e1fa 100%)',
		vars: {
			color: '#3f3d63',
			'--foreground': '#3f3d63',
			'--muted-foreground': '#8683ad',
			'--border': '#dcd7f5',
			'--dash-card-bg': 'linear-gradient(145deg, #ffffff 0%, #f3f1fd 100%)',
			'--dash-card-border': 'transparent',
			'--dash-card-radius': '16px',
			'--dash-card-shadow':
				'8px 8px 20px rgb(93 74 205 / 0.14), -6px -6px 16px rgb(255 255 255 / 0.9)',
			'--dash-chart-content': '#3f3d63',
			'--dash-chart-surface-100': '#ffffff',
			'--dash-chart-surface-200': '#efecfb',
			'--dash-chart-surface-300': '#dcd7f5'
		}
	},
	{
		id: 'neo-mint',
		name: 'Mint neumorphic',
		description: 'Clean spreadsheet feel: soft white cards with green accents.',
		mode: 'light',
		colorScheme: 'mint',
		background:
			'radial-gradient(900px 500px at 10% -10%, rgb(187 247 208 / 0.4), transparent 55%), linear-gradient(160deg, #f2f7f4 0%, #e8f1ec 100%)',
		vars: {
			color: '#1f3a33',
			'--foreground': '#1f3a33',
			'--muted-foreground': '#6f8d83',
			'--border': '#d9e7e0',
			'--dash-card-bg': 'linear-gradient(145deg, #ffffff 0%, #f1f7f3 100%)',
			'--dash-card-border': 'transparent',
			'--dash-card-radius': '16px',
			'--dash-card-shadow':
				'8px 8px 20px rgb(31 74 58 / 0.1), -6px -6px 16px rgb(255 255 255 / 0.95)',
			'--dash-chart-content': '#1f3a33',
			'--dash-chart-surface-100': '#ffffff',
			'--dash-chart-surface-200': '#eef5f0',
			'--dash-chart-surface-300': '#d9e7e0'
		}
	},
	{
		id: 'glass-teal',
		name: 'Midnight glass',
		description: 'Translucent cards over a deep teal gradient.',
		mode: 'dark',
		colorScheme: 'glass',
		background:
			'radial-gradient(1000px 520px at 80% -10%, rgb(45 212 191 / 0.16), transparent 60%), radial-gradient(800px 500px at 0% 100%, rgb(14 116 144 / 0.25), transparent 55%), linear-gradient(160deg, #0d3b38 0%, #071f1e 100%)',
		vars: {
			color: '#e6f4f1',
			'--foreground': '#e6f4f1',
			'--muted-foreground': 'rgb(230 244 241 / 0.62)',
			'--border': 'rgb(255 255 255 / 0.14)',
			'--dash-card-bg':
				'linear-gradient(160deg, rgb(255 255 255 / 0.1) 0%, rgb(255 255 255 / 0.03) 100%)',
			'--dash-card-border': 'rgb(255 255 255 / 0.16)',
			'--dash-card-radius': '14px',
			'--dash-card-shadow': '0 12px 32px rgb(0 0 0 / 0.35)',
			'--dash-chart-content': '#e6f4f1',
			'--dash-chart-surface-100': 'rgb(255 255 255 / 0.06)',
			'--dash-chart-surface-200': 'rgb(255 255 255 / 0.1)',
			'--dash-chart-surface-300': 'rgb(255 255 255 / 0.18)'
		}
	}
];

export function getDashboardTheme(id: string | undefined): DashboardTheme {
	return dashboardThemes.find((theme) => theme.id === id) ?? dashboardThemes[0];
}

export function themeStyle(theme: DashboardTheme, backgroundOverride?: string): string {
	const parts: string[] = [];
	const background = backgroundOverride || theme.background;
	if (background) {
		parts.push(
			backgroundOverride ? `background-color: ${background}` : `background: ${background}`
		);
	}
	for (const [property, value] of Object.entries(theme.vars)) {
		parts.push(`${property}: ${value}`);
	}
	return parts.join('; ');
}
