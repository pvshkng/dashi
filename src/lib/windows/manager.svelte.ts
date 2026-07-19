export type DockSide = 'left' | 'right' | null;

export interface WindowState {
	id: string;
	open: boolean;
	docked: DockSide;
	maximized: boolean;
	x: number;
	y: number;
	width: number;
	height: number;
	dockWidth: number;
	z: number;
}

export interface WindowOptions {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
}

function initialWindow(id: string, options: WindowOptions = {}): WindowState {
	return {
		id,
		open: false,
		docked: null,
		maximized: false,
		x: options.x ?? 120,
		y: options.y ?? 80,
		width: options.width ?? 560,
		height: options.height ?? 420,
		dockWidth: 380,
		z: 1
	};
}

class WindowManager {
	windows = $state<Record<string, WindowState>>({
		sql: initialWindow('sql', { x: 120, y: 80 }),
		connections: initialWindow('connections', { x: 180, y: 140 }),
		settings: initialWindow('settings', { x: 240, y: 200 })
	});
	private topZ = 1;
	private cascade = 0;

	/** Register a window if it doesn't exist yet (used for dynamic per-widget windows). */
	ensure(id: string, options: WindowOptions = {}): WindowState {
		if (!this.windows[id]) {
			this.cascade = (this.cascade + 1) % 8;
			this.windows[id] = initialWindow(id, {
				x: options.x ?? 160 + this.cascade * 32,
				y: options.y ?? 100 + this.cascade * 32,
				width: options.width,
				height: options.height
			});
		}
		return this.windows[id];
	}

	open(id: string, options: WindowOptions = {}): void {
		this.ensure(id, options);
		this.windows[id].open = true;
		this.bringToFront(id);
	}

	toggle(id: string): void {
		const win = this.ensure(id);
		win.open = !win.open;
		if (win.open) this.bringToFront(id);
	}

	close(id: string): void {
		if (this.windows[id]) this.windows[id].open = false;
	}

	bringToFront(id: string): void {
		this.topZ += 1;
		this.windows[id].z = this.topZ;
	}

	dock(id: string, side: DockSide): void {
		this.windows[id].docked = side;
		this.windows[id].maximized = false;
		this.bringToFront(id);
	}

	toggleMaximize(id: string): void {
		const win = this.windows[id];
		win.docked = null;
		win.maximized = !win.maximized;
		this.bringToFront(id);
	}

	isOpen(id: string): boolean {
		return this.windows[id]?.open ?? false;
	}
}

export const windowManager = new WindowManager();
