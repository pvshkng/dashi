import { connectionsStore } from '$lib/connections/store.svelte';
import type { CsvConnection } from '$lib/connections/types';

export type SampleCategory = 'economy' | 'climate' | 'markets' | 'society';

export interface SampleDataset {
	id: string;
	name: string;
	description: string;
	source: string;
	category: SampleCategory;
	url: string;
	tableName: string;
	columns: string[];
	sizeHint: string;
}

export const sampleCategories: Record<SampleCategory, string> = {
	economy: 'Economy',
	climate: 'Climate',
	markets: 'Markets',
	society: 'Society'
};

/** Curated open datasets fetched on demand; nothing is bundled with the app. */
export const sampleDatasets: SampleDataset[] = [
	{
		id: 'gdp',
		name: 'GDP by country',
		description: 'Yearly gross domestic product for every country since 1960.',
		source: 'World Bank',
		category: 'economy',
		url: 'https://cdn.jsdelivr.net/gh/datasets/gdp@master/data/gdp.csv',
		tableName: 'gdp',
		columns: ['Country Name', 'Country Code', 'Year', 'Value'],
		sizeHint: '~11k rows'
	},
	{
		id: 'population',
		name: 'World population',
		description: 'Yearly population per country and world aggregates since 1960.',
		source: 'World Bank',
		category: 'society',
		url: 'https://cdn.jsdelivr.net/gh/datasets/population@master/data/population.csv',
		tableName: 'population',
		columns: ['Country Name', 'Country Code', 'Year', 'Value'],
		sizeHint: '~15k rows'
	},
	{
		id: 'co2_global',
		name: 'Global CO2 emissions',
		description: 'Global fossil fuel emissions by fuel type since 1750.',
		source: 'CDIAC / World Bank',
		category: 'climate',
		url: 'https://cdn.jsdelivr.net/gh/datasets/co2-fossil-global@master/data/global.csv',
		tableName: 'co2_global',
		columns: ['Year', 'Total', 'Gas Fuel', 'Liquid Fuel', 'Solid Fuel', 'Per Capita'],
		sizeHint: '~270 rows'
	},
	{
		id: 'co2_concentration',
		name: 'CO2 concentration',
		description: 'Monthly atmospheric CO2 measured at Mauna Loa since 1958.',
		source: 'Scripps / NOAA',
		category: 'climate',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/co2-concentration.csv',
		tableName: 'co2_concentration',
		columns: ['Date', 'CO2', 'adjusted CO2'],
		sizeHint: '~740 rows'
	},
	{
		id: 'seattle_weather',
		name: 'Seattle weather',
		description: 'Daily precipitation, temperature and wind for 2012-2015.',
		source: 'NOAA',
		category: 'climate',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/seattle-weather.csv',
		tableName: 'seattle_weather',
		columns: ['date', 'precipitation', 'temp_max', 'temp_min', 'wind', 'weather'],
		sizeHint: '~1.5k rows'
	},
	{
		id: 'disasters',
		name: 'Natural disasters',
		description: 'Deaths from natural disasters by type and year since 1900.',
		source: 'OurWorldInData',
		category: 'climate',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/disasters.csv',
		tableName: 'disasters',
		columns: ['Entity', 'Year', 'Deaths'],
		sizeHint: '~800 rows'
	},
	{
		id: 'stocks',
		name: 'Tech stock prices',
		description: 'Monthly prices for AAPL, AMZN, GOOG, IBM and MSFT, 2000-2010.',
		source: 'Vega datasets',
		category: 'markets',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/stocks.csv',
		tableName: 'stocks',
		columns: ['symbol', 'date', 'price'],
		sizeHint: '~560 rows'
	},
	{
		id: 'sp500',
		name: 'S&P 500',
		description: 'Monthly S&P 500 index closing prices, 2000-2010.',
		source: 'Vega datasets',
		category: 'markets',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/sp500.csv',
		tableName: 'sp500',
		columns: ['date', 'price'],
		sizeHint: '~120 rows'
	},
	{
		id: 'us_employment',
		name: 'US employment',
		description: 'Monthly US jobs by sector around the 2008 crisis.',
		source: 'US BLS',
		category: 'economy',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/us-employment.csv',
		tableName: 'us_employment',
		columns: ['month', 'nonfarm', 'private', 'government'],
		sizeHint: '~120 rows'
	},
	{
		id: 'iowa_electricity',
		name: 'Iowa electricity',
		description: 'Yearly net power generation in Iowa by source.',
		source: 'US EIA',
		category: 'economy',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/iowa-electricity.csv',
		tableName: 'iowa_electricity',
		columns: ['year', 'source', 'net_generation'],
		sizeHint: '~50 rows'
	},
	{
		id: 'airports',
		name: 'US airports',
		description: 'Every US airport with location, city and state.',
		source: 'FAA',
		category: 'society',
		url: 'https://cdn.jsdelivr.net/npm/vega-datasets@2.11.0/data/airports.csv',
		tableName: 'airports',
		columns: ['iata', 'name', 'city', 'state', 'latitude', 'longitude'],
		sizeHint: '~3.4k rows'
	}
];

export function sampleConnectionId(datasetId: string): string {
	return `sample-${datasetId}`;
}

export function sampleDatasetById(id: string): SampleDataset | undefined {
	return sampleDatasets.find((dataset) => dataset.id === id);
}

export function isSampleInstalled(datasetId: string): boolean {
	return connectionsStore.connections.some((c) => c.id === sampleConnectionId(datasetId));
}

/** Downloads the CSV and registers it as a regular file connection. */
export async function installSampleDataset(dataset: SampleDataset): Promise<void> {
	if (isSampleInstalled(dataset.id)) return;
	const response = await fetch(dataset.url);
	if (!response.ok) throw new Error(`Download failed (${response.status}) for ${dataset.name}.`);
	const blob = await response.blob();
	const connection: CsvConnection = {
		id: sampleConnectionId(dataset.id),
		name: dataset.name,
		createdAt: Date.now(),
		kind: 'csv',
		fileName: `${dataset.id}.csv`,
		tableName: dataset.tableName
	};
	await connectionsStore.addFileConnection(connection, blob);
}

export async function installSampleById(datasetId: string): Promise<void> {
	const dataset = sampleDatasetById(datasetId);
	if (!dataset) throw new Error(`Unknown sample dataset: ${datasetId}`);
	await installSampleDataset(dataset);
}
