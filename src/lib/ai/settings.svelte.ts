import { get, set } from 'idb-keyval';

const KEY = 'ai:settings';

export interface AiSettings {
	/** OpenAI-compatible chat completions base URL, e.g. http://localhost:11434/v1 for Ollama. */
	endpoint: string;
	apiKey: string;
	model: string;
}

const defaults: AiSettings = { endpoint: '', apiKey: '', model: '' };

class AiSettingsStore {
	settings = $state<AiSettings>({ ...defaults });
	loaded = $state(false);

	async load(): Promise<void> {
		if (this.loaded) return;
		this.settings = { ...defaults, ...(await get<AiSettings>(KEY)) };
		this.loaded = true;
	}

	async update(partial: Partial<AiSettings>): Promise<void> {
		this.settings = { ...this.settings, ...partial };
		await set(KEY, $state.snapshot(this.settings));
	}

	get configured(): boolean {
		return Boolean(this.settings.endpoint && this.settings.model);
	}
}

export const aiSettings = new AiSettingsStore();
