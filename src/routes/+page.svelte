<script lang="ts">
	import { LineChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';

	const data = [
		{ date: new Date('2024-01-01'), value: 12 },
		{ date: new Date('2024-02-01'), value: 18 },
		{ date: new Date('2024-03-01'), value: 9 },
		{ date: new Date('2024-04-01'), value: 24 },
		{ date: new Date('2024-05-01'), value: 15 }
	];
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<div class="lc-root-container h-64 w-full max-w-xl">
	<LineChart {data} x="date" y="value" curve={curveNatural} />
</div>
