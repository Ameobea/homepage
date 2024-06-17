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
		src="https://i.ameo.link/c8l.jpg"
		loading="lazy"
		alt="A screenshot of a low-poly icosphere rendered with smooth shading in Three.JS.  It's possible to see that it's composed of rather large polygons when looking against the background, but it's not clear when looking at the interior of the mesh itself. It's textured with a gray stone-like pattern and floating above a platform made of the same material.  The background is pure black."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/c8m.jpg"
		loading="lazy"
		alt="A screenshot of a low-poly icosphere rendered with flat shading in Three.JS.  It's very clear to see where each of the triangles that make it up start and end since there is a very clear line where the shade of the color of the surface suddenly changes. It's textured with a gray stone-like pattern and floating above a platform made of the same material.  The background is pure black."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
