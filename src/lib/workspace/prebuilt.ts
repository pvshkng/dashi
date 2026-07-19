import type { Widget, WidgetLayout } from '$lib/widgets/types';
import type { ThumbKind } from '$lib/workflow/templates';
import { instantiateTemplate, templateById } from '$lib/workflow/templates';
import { workspaceStore } from './store.svelte';

interface PresetItem {
	templateId: string;
	layout: WidgetLayout;
	title?: string;
}

export interface DashboardPreset {
	id: string;
	name: string;
	tagline: string;
	description: string;
	intro: string;
	items: PresetItem[];
	colorScheme: string;
	theme?: string;
}

export const dashboardPresets: DashboardPreset[] = [
	{
		id: 'lavender-studio',
		name: 'Lavender studio',
		tagline: 'Neumorphic KPI board in soft purple',
		description: 'Soft raised cards on a lavender canvas, styled after classic admin kits.',
		intro:
			'Mock sales KPIs on the lavender neumorphic theme. Swap the workflows for your own data.',
		colorScheme: 'purple',
		theme: 'neo-purple',
		items: [
			{ templateId: 'total-revenue', layout: { x: 0, y: 2, w: 4, h: 2 } },
			{ templateId: 'monthly-revenue', layout: { x: 4, y: 0, w: 8, h: 4 } },
			{ templateId: 'north-share', layout: { x: 0, y: 4, w: 2, h: 2 } },
			{ templateId: 'avg-sale-value', layout: { x: 2, y: 4, w: 2, h: 2 } },
			{ templateId: 'revenue-trend', layout: { x: 4, y: 4, w: 8, h: 4 } },
			{ templateId: 'revenue-by-region', layout: { x: 0, y: 6, w: 4, h: 4 } },
			{ templateId: 'sales-table', layout: { x: 4, y: 8, w: 8, h: 4 } },
			{ templateId: 'total-units', layout: { x: 0, y: 10, w: 4, h: 2 } }
		]
	},
	{
		id: 'mint-ledger',
		name: 'Mint ledger',
		tagline: 'Spreadsheet-style board in fresh green',
		description: 'Clean white cards with green accents, styled after office dashboard kits.',
		intro: 'Mock sales KPIs on the mint neumorphic theme. Swap the workflows for your own data.',
		colorScheme: 'mint',
		theme: 'neo-mint',
		items: [
			{ templateId: 'total-units', layout: { x: 0, y: 2, w: 4, h: 2 } },
			{
				templateId: 'monthly-revenue',
				layout: { x: 4, y: 0, w: 8, h: 4 },
				title: 'Revenue generated'
			},
			{ templateId: 'units-by-region', layout: { x: 0, y: 4, w: 6, h: 4 } },
			{ templateId: 'revenue-by-region', layout: { x: 6, y: 4, w: 6, h: 4 } },
			{ templateId: 'revenue-trend', layout: { x: 0, y: 8, w: 8, h: 4 } },
			{ templateId: 'avg-sale-value', layout: { x: 8, y: 8, w: 4, h: 2 } },
			{ templateId: 'north-share', layout: { x: 8, y: 10, w: 4, h: 2 } }
		]
	},
	{
		id: 'midnight-glass',
		name: 'Midnight glass',
		tagline: 'Dark glassmorphic board in deep teal',
		description: 'Translucent cards over a teal gradient, styled after dark consulting decks.',
		intro: 'Mock sales KPIs on the midnight glass theme. Swap the workflows for your own data.',
		colorScheme: 'glass',
		theme: 'glass-teal',
		items: [
			{ templateId: 'total-revenue', layout: { x: 0, y: 2, w: 4, h: 2 } },
			{
				templateId: 'monthly-revenue',
				layout: { x: 4, y: 0, w: 8, h: 4 },
				title: 'Monthly sales'
			},
			{
				templateId: 'revenue-trend',
				layout: { x: 0, y: 4, w: 8, h: 4 },
				title: 'Regional performance'
			},
			{ templateId: 'north-share', layout: { x: 8, y: 4, w: 4, h: 2 } },
			{ templateId: 'avg-sale-value', layout: { x: 8, y: 6, w: 4, h: 2 } },
			{ templateId: 'units-vs-revenue', layout: { x: 0, y: 8, w: 6, h: 4 } },
			{ templateId: 'units-by-region', layout: { x: 6, y: 8, w: 6, h: 4 }, title: 'Product mix' }
		]
	},
	{
		id: 'sales',
		name: 'Sales overview',
		tagline: 'Revenue, regions and unit economics',
		description: 'A classic sales board built on the bundled mock data. Works offline.',
		intro: 'Revenue KPIs from the mock sales table. Edit the workflows to plug in your own data.',
		colorScheme: 'blue',
		items: [
			{ templateId: 'total-revenue', layout: { x: 0, y: 2, w: 4, h: 2 } },
			{ templateId: 'monthly-revenue', layout: { x: 4, y: 0, w: 8, h: 4 } },
			{ templateId: 'revenue-by-region', layout: { x: 0, y: 4, w: 4, h: 4 } },
			{ templateId: 'units-vs-revenue', layout: { x: 4, y: 4, w: 8, h: 4 } }
		]
	},
	{
		id: 'world-economy',
		name: 'World economy',
		tagline: 'GDP and population at a glance',
		description: 'World Bank GDP and population data: biggest economies and global growth.',
		intro: 'GDP and population trends from World Bank open data.',
		colorScheme: 'blue',
		items: [
			{ templateId: 'world-population-now', layout: { x: 0, y: 2, w: 4, h: 2 } },
			{ templateId: 'gdp-top-economies', layout: { x: 4, y: 0, w: 8, h: 4 } },
			{ templateId: 'world-population', layout: { x: 0, y: 4, w: 6, h: 4 } },
			{ templateId: 'us-jobs', layout: { x: 6, y: 4, w: 6, h: 4 } }
		]
	},
	{
		id: 'climate',
		name: 'Climate watch',
		tagline: 'Emissions, CO2 and disasters',
		description: 'Two centuries of emissions, the Keeling curve and disaster impact.',
		intro: 'Climate indicators from CDIAC, Scripps and OurWorldInData.',
		colorScheme: 'forest',
		items: [
			{ templateId: 'co2-concentration', layout: { x: 0, y: 2, w: 6, h: 4 } },
			{ templateId: 'co2-emissions', layout: { x: 6, y: 0, w: 6, h: 4 } },
			{ templateId: 'disaster-deaths', layout: { x: 0, y: 6, w: 12, h: 4 } }
		]
	},
	{
		id: 'markets',
		name: 'Market pulse',
		tagline: 'A decade of stocks and the index',
		description: 'Tech stocks against the S&P 500 through two crashes, 2000-2010.',
		intro: 'Monthly closing prices for five tech stocks and the S&P 500.',
		colorScheme: 'grayscale',
		items: [
			{ templateId: 'stock-prices', layout: { x: 0, y: 2, w: 12, h: 4 } },
			{ templateId: 'sp500-trend', layout: { x: 0, y: 6, w: 12, h: 4 } }
		]
	},
	{
		id: 'weather',
		name: 'Seattle weather',
		tagline: 'Four years of Pacific Northwest sky',
		description: 'Temperature seasonality and rainfall patterns for Seattle, 2012-2015.',
		intro: 'Daily NOAA observations aggregated into monthly views.',
		colorScheme: 'sunset',
		items: [
			{ templateId: 'seattle-temperature', layout: { x: 0, y: 2, w: 8, h: 4 } },
			{ templateId: 'seattle-rain', layout: { x: 8, y: 0, w: 4, h: 4 } }
		]
	},
	{
		id: 'infrastructure',
		name: 'US infrastructure',
		tagline: 'Airports and the energy mix',
		description: 'Where US airports concentrate and how Iowa generates its power.',
		intro: 'FAA airport registry and EIA generation data.',
		colorScheme: 'blue',
		items: [
			{ templateId: 'airports-by-state', layout: { x: 0, y: 2, w: 8, h: 4 } },
			{ templateId: 'iowa-energy-mix', layout: { x: 8, y: 0, w: 4, h: 4 } },
			{ templateId: 'airport-directory', layout: { x: 0, y: 6, w: 12, h: 4 } }
		]
	}
];

export function presetById(id: string): DashboardPreset | undefined {
	return dashboardPresets.find((preset) => preset.id === id);
}

export function presetThumbs(preset: DashboardPreset): { kind: ThumbKind; layout: WidgetLayout }[] {
	return preset.items.map((item) => ({
		kind: templateById(item.templateId)?.thumb ?? 'bar',
		layout: item.layout
	}));
}

/**
 * Replaces the current dashboard with the preset. Downloads any datasets the
 * preset needs and upserts its workflows under stable ids so reloading a
 * preset never duplicates them.
 */
export async function loadDashboardPreset(preset: DashboardPreset): Promise<void> {
	const widgets: Widget[] = [
		{
			id: `preset-${preset.id}-intro`,
			title: preset.name,
			kind: 'text',
			layout: { x: 0, y: 0, w: 4, h: 2 },
			config: { content: intro(preset) }
		}
	];
	for (const item of preset.items) {
		const template = templateById(item.templateId);
		if (!template) continue;
		const workflow = await instantiateTemplate(template, {
			workflowId: `preset-${preset.id}-${template.id}`,
			chartScheme: preset.theme ? preset.colorScheme : undefined
		});
		widgets.push({
			id: `preset-${preset.id}-${template.id}`,
			title: item.title ?? template.name,
			kind: 'viz',
			layout: item.layout,
			config: { workflowId: workflow.id, nodeId: template.primaryNodeId }
		});
	}
	workspaceStore.replaceWidgets(widgets);
	workspaceStore.updateSettings({
		name: preset.name,
		colorScheme: preset.colorScheme,
		theme: preset.theme ?? 'classic'
	});
}

function intro(preset: DashboardPreset): string {
	return `${preset.name}\n${preset.intro}`;
}
