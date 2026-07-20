export interface WidgetLayout {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Pixel-based rectangle used by the freeform (non-grid) layout mode. */
export interface FreeRect {
	x: number;
	y: number;
	w: number;
	h: number;
	z?: number;
}

export interface TextWidgetConfig {
	content: string;
}

/** Points at a visualization node inside a workflow. */
export interface VizWidgetConfig {
	workflowId: string;
	nodeId: string;
	/** Re-run the backing workflow every N seconds. */
	refreshSec?: number;
}

export type FilterControl = 'dropdown' | 'multi' | 'search' | 'range' | 'daterange';

/** Dashboard-level filter control; applies to every viz widget sharing the column. */
export interface FilterWidgetConfig {
	column: string;
	control: FilterControl;
	/** Node whose result provides the dropdown options. */
	optionsWorkflowId?: string;
	optionsNodeId?: string;
}

export type ShapeKind = 'rectangle' | 'ellipse' | 'triangle' | 'line' | 'arrow';

export interface ShapeWidgetConfig {
	shape: ShapeKind;
	fill: string;
	stroke: string;
	strokeWidth: number;
}

export type WidgetKind = 'text' | 'viz' | 'shape' | 'filter';

/**
 * Visual customization for a widget, edited via the settings window.
 * Every field is optional; unset fields fall back to the app defaults.
 */
export interface WidgetStyle {
	/** Hide the title bar for presentation-style elements (text, shapes). */
	showHeader?: boolean;
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
	/** Position in freeform mode; initialized from the grid layout on first use. */
	free?: FreeRect;
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

export interface ShapeWidget extends WidgetBase {
	kind: 'shape';
	config: ShapeWidgetConfig;
}

export interface FilterWidget extends WidgetBase {
	kind: 'filter';
	config: FilterWidgetConfig;
}

export type Widget = TextWidget | VizWidget | ShapeWidget | FilterWidget;
