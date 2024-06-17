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

<img-comparison-slider style="width: 100%; height: 100vh;">
	<img
		style="width: 100%"
		slot="first"
		src="/depth_based_fragment_culling/before.jpg"
		loading="lazy"
		alt="A screenshot of a room from my WebGL/Three.JS based game without any hex tiling.  There are clear places where the textures tile and it looks bad and unrealistic even though the textures themselves are seamless"
	/>
	<img
		style="width: 100%"
		slot="second"
		src="/depth_based_fragment_culling/after.jpg"
		loading="lazy"
		alt="A screenshot of a room from my WebGL/Three.JS based game with a tile-breaking shader in use.  The textures blend together in such a way that no tile points are visible."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
