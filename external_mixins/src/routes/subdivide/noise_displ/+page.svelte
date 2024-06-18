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
		src="https://i.ameo.link/c8s.jpg"
		loading="lazy"
		alt="A screenshot of a scene rendered with Three.JS.  There are several floating geometric forms above a rectangular platform.  They're composed of simple shapes with sharp angles. All the shapes and the platform are shaded with a dark gray rock or cement-like color.  There are some shadows visible cast from a light source off screen. The background is pure black."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/c8t.jpg"
		loading="lazy"
		alt="A screenshot of a scene rendered with Three.JS.  There are several floating geometric forms above a rectangular platform.  They're heavily warped and deformed in a somewhat organic-looking way.  The surface of the platform is wrinkly and irregular which has caused a series of complex shadows to emerge. There are some shadows visible cast from a light source off screen. The background is pure black."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
