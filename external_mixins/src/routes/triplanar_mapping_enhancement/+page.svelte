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
		src="https://i.ameo.link/cel.avif"
		loading="lazy"
		alt="A screenshot of a smooth-shaded, low-poly sphere rendered with Three.JS.  The sphere is textured with a gray rock-like texture and there are obvious areas where the texture is layered on top of itself with transparency."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/cem.avif"
		loading="lazy"
		alt="A screenshot of a smooth-shaded, low-poly sphere rendered with Three.JS.  The sphere is textured with a gray rock-like texture, but there aren't any obvious areas where the texture is overlaid.  There are some areas where it fades smoothly between different colors."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
