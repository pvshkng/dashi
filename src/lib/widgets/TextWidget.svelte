<script lang="ts">
	import type { TextWidget } from './types';

	let { widget }: { widget: TextWidget } = $props();
</script>

<div class="h-full w-full overflow-auto p-2 text-sm whitespace-pre-wrap">
	{widget.config.content}
</div>
