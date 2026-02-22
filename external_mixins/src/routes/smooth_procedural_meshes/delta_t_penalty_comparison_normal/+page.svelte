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
		src="https://i.ameo.link/dj4.avif"
		loading="lazy"
		alt="A screenshot of a curved portion of a smooth mesh rendered with `MeshNormalMaterial` in Three.JS.  There are notable shading artifacts along the curve which show up as trianglular discontinuities in the coloration."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/dj5.avif"
		loading="lazy"
		alt="A screenshot of a curved portion of a smooth mesh rendered with `MeshNormalMaterial` in Three.JS.  There are still some minor shading artifacts along the curve, but they're very significantly reduced and appear more as subtle smudges rather than sharp discontinuities."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
