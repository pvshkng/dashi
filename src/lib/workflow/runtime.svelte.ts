import { connectionsStore } from '$lib/connections/store.svelte';
import { runWorkflow, type WorkflowRun } from './engine';
import type { Workflow } from './types';

export interface RunState {
	status: 'idle' | 'running' | 'done' | 'error';
	run: WorkflowRun | null;
	forUpdatedAt: number;
	finishedAt: number;
}

/**
 * Per-window cache of workflow runs. Widgets and the editor share one run
 * per workflow; a run is stale once the workflow's updatedAt moves past it.
 */
class WorkflowRuntime {
	states = $state<Record<string, RunState>>({});
	private pending = new Map<string, Promise<WorkflowRun>>();

	get(workflowId: string): RunState | undefined {
		return this.states[workflowId];
	}

	invalidate(workflowId: string): void {
		delete this.states[workflowId];
		this.pending.delete(workflowId);
	}

	async run(workflow: Workflow): Promise<WorkflowRun> {
		const existing = this.pending.get(workflow.id);
		if (existing) return existing;

		this.states[workflow.id] = {
			status: 'running',
			run: this.states[workflow.id]?.run ?? null,
			forUpdatedAt: workflow.updatedAt,
			finishedAt: 0
		};

		const promise = (async () => {
			if (!connectionsStore.loaded) {
				await connectionsStore.load();
				await connectionsStore.reregisterFileConnections();
			}
			const run = await runWorkflow(workflow, connectionsStore.connections);
			this.states[workflow.id] = {
				status: run.error ? 'error' : 'done',
				run,
				forUpdatedAt: workflow.updatedAt,
				finishedAt: Date.now()
			};
			return run;
		})();

		this.pending.set(workflow.id, promise);
		try {
			return await promise;
		} finally {
			this.pending.delete(workflow.id);
		}
	}

	/** Run only if there is no fresh result for the workflow's current version. */
	async ensure(workflow: Workflow): Promise<WorkflowRun | null> {
		const state = this.states[workflow.id];
		if (state && state.forUpdatedAt === workflow.updatedAt && state.status !== 'idle') {
			if (state.status === 'running') return this.pending.get(workflow.id) ?? null;
			return state.run;
		}
		return this.run(workflow);
	}
}

export const workflowRuntime = new WorkflowRuntime();
