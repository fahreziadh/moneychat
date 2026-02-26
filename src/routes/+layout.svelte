<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initConvex } from '$lib/convex';

	initConvex();

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
