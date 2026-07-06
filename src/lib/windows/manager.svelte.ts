export type WindowId = 'sql' | 'connections' | 'settings';
export type DockSide = 'left' | 'right' | null;

export interface WindowState {
	id: WindowId;
	open: boolean;
	docked: DockSide;
	x: number;
	y: number;
	width: number;
	height: number;
	dockWidth: number;
	z: number;
}

function initialWindow(id: WindowId, x: number, y: number): WindowState {
	return { id, open: false, docked: null, x, y, width: 560, height: 420, dockWidth: 380, z: 1 };
}

class WindowManager {
	windows = $state<Record<WindowId, WindowState>>({
		sql: initialWindow('sql', 120, 80),
		connections: initialWindow('connections', 180, 140),
		settings: initialWindow('settings', 240, 200)
	});
	private topZ = 1;

	toggle(id: WindowId): void {
		const win = this.windows[id];
		win.open = !win.open;
		if (win.open) this.bringToFront(id);
	}

	close(id: WindowId): void {
		this.windows[id].open = false;
	}

	bringToFront(id: WindowId): void {
		this.topZ += 1;
		this.windows[id].z = this.topZ;
	}

	dock(id: WindowId, side: DockSide): void {
		this.windows[id].docked = side;
		this.bringToFront(id);
	}
}

export const windowManager = new WindowManager();
