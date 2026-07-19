export interface WidgetLayout {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface TextWidgetConfig {
	content: string;
}

/** Points at a visualization node inside a workflow. */
export interface VizWidgetConfig {
	workflowId: string;
	nodeId: string;
}

export type WidgetKind = 'text' | 'viz';

/**
 * Visual customization for a widget, edited via the settings window.
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

export interface VizWidget extends WidgetBase {
	kind: 'viz';
	config: VizWidgetConfig;
}

export type Widget = TextWidget | VizWidget;
