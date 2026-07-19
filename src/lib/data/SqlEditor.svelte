<script lang="ts">
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState, Compartment, Prec } from '@codemirror/state';
	import { basicSetup } from 'codemirror';
	import { sql, type SQLNamespace } from '@codemirror/lang-sql';

	let {
		value = $bindable(''),
		schema = {},
		onRun
	}: {
		value?: string;
		schema?: SQLNamespace;
		onRun: () => void;
	} = $props();

	const langCompartment = new Compartment();
	let view: EditorView | undefined;

	function makeSql() {
		return sql({ schema, upperCaseKeywords: false });
	}

	function editor(element: HTMLElement) {
		view = new EditorView({
			parent: element,
			state: EditorState.create({
				doc: value,
				extensions: [
					Prec.highest(
						keymap.of([
							{
								key: 'Mod-Enter',
								run: () => {
									onRun();
									return true;
								}
							}
						])
					),
					basicSetup,
					langCompartment.of(makeSql()),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) value = update.state.doc.toString();
					}),
					EditorView.theme({
						'&': { height: '100%', fontSize: '12px' },
						'.cm-content': { fontFamily: "'JetBrains Mono Variable', monospace" },
						'.cm-scroller': { fontFamily: "'JetBrains Mono Variable', monospace" },
						'&.cm-focused': { outline: 'none' }
					})
				]
			})
		});
		return () => {
			view?.destroy();
			view = undefined;
		};
	}

	$effect(() => {
		void schema;
		view?.dispatch({ effects: langCompartment.reconfigure(makeSql()) });
	});

	// External value changes (history restore, table click) sync into the editor.
	$effect(() => {
		if (view && value !== view.state.doc.toString()) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
		}
	});
</script>

<div class="h-full w-full overflow-hidden" {@attach editor}></div>
