export interface WidgetLayout {
	x: number;
	y: number;
	w: number;
	h: number;
}

export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'pie';

export interface DataSourceRef {
	connectionId: string;
	sql: string;
}

export interface TextWidgetConfig {
	content: string;
}

export interface TableWidgetConfig {
	dataSource: DataSourceRef;
}

export interface ChartWidgetConfig {
	dataSource: DataSourceRef;
	chartType: ChartType;
	x: string;
	y: string;
	series?: string;
	colorScheme: string;
}

export type WidgetKind = 'text' | 'table' | 'chart';

/**
 * Visual customization for a widget, edited via the palette popover.
 * Every field is optional; unset fields fall back to the app defaults.
 */
export interface WidgetStyle {
	fontFamily?: 'sans' | 'serif' | 'mono';
	fontSize?: number;
	textAlign?: 'left' | 'center' | 'right';
	textColor?: string;
	backgroundColor?: string;
	borderColor?: string;
	borderWidth?: number;
	borderRadius?: number;
	padding?: number;
	shadow?: 'none' | 'sm' | 'md' | 'lg';
	opacity?: number;
}

interface WidgetBase {
	id: string;
	title: string;
	layout: WidgetLayout;
	style?: WidgetStyle;
}

export interface TextWidget extends WidgetBase {
	kind: 'text';
	config: TextWidgetConfig;
}

export interface TableWidget extends WidgetBase {
	kind: 'table';
	config: TableWidgetConfig;
}

export interface ChartWidget extends WidgetBase {
	kind: 'chart';
	config: ChartWidgetConfig;
}

export type Widget = TextWidget | TableWidget | ChartWidget;

export interface Dashboard {
	id: string;
	name: string;
	createdAt: number;
	widgetIds: string[];
	colorScheme: string;
}
