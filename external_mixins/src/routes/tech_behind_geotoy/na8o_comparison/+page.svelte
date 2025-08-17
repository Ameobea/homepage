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
		src="https://i.ameo.link/d8m.avif"
		loading="lazy"
		alt="A screenshot of a 3D Hilbert curve rendered with Three.JS. The curve is textured with a white texture with blue lines on a black background without SSAO.  It appears rather bright and mostly uniformly lit with some shadows in certain areas, but not too much."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/d8n.avif"
		loading="lazy"
		alt="A screenshot of a 3D Hilbert curve rendered with Three.JS. The curve is textured with a white texture with blue lines on a black background with SSAO. It appears darker overall, with more pronounced shadows in the crevices and areas where parts of the curve are close together, giving it a greater sense of depth and dimensionality."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
