<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const script = document.createElement('script');
		script.defer = true;
		script.src = 'https://unpkg.com/img-comparison-slider@7/dist/index.js';
		document.body.appendChild(script);
	});
</script>

<svelte:head>
	<style lang="css">
		img-comparison-slider {
			visibility: hidden;
		}

		img-comparison-slider [slot='second'] {
			display: none;
		}

		img-comparison-slider.rendered {
			visibility: inherit;
		}

		img-comparison-slider.rendered [slot='second'] {
			display: unset;
		}
	</style>
</svelte:head>

<img-comparison-slider style="max-height: 100vh" value="65">
	<img
		style="width: 100%"
		slot="first"
		src="https://i.ameo.link/c8g.jpg"
		loading="lazy"
		alt="A screenshot of a cube rendered in Three.JS.  It's textured with a gray stone-like pattern and floating above a platform made of the same material.  The background is pure black."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/c8h.jpg"
		loading="lazy"
		alt="A screenshot of the results of applying a constant displacement to all vertices of the subdivided cube.  Each side of the cube has separated from each other and are floating off on their own with considerable distance between them.  The stone platform has rasied higher as well."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
