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

<img-comparison-slider style="max-height: 100vh">
	<img
		style="width: 100%"
		slot="first"
		src="https://i.ameo.link/dj6.avif"
		loading="lazy"
		alt="A screenshot of a curved mesh rendered with magenta wireframe.  Rings of vertices are stitched together with triangles horizontally.  There are several instances of large triangle fans where the same vertex is used as the tip of several triangles spanning to the next ring."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/dj7.avif"
		loading="lazy"
		alt="A screenshot of a curved mesh rendered with magenta wireframe.  Rings of vertices are stitched together with triangles horizontally.  There are still some triangle fans used to stitch the rings, but they're much smaller and less common; most of the rings are bridged with simpler patterns."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
