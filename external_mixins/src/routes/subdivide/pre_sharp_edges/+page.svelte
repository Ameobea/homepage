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

<img-comparison-slider style="max-height: 100vh" value="23">
	<img
		style="width: 100%"
		slot="first"
		src="https://i.ameo.link/c93.jpg"
		loading="lazy"
		alt="A screenshot of some amorphous structures floating above a wrinkly platform with a pure black background.  Everything is composed of the same gray stone or concrete-like material.  There are prominent shadows cast from the terrian and the floating structures on each other and on the platform.  The edges of the elongated structure floating in the foreground are mostly sharp, but appear somewhat smooth - especially on the left side."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/c94.jpg"
		loading="lazy"
		alt="A screenshot of some amorphous structures floating above a wrinkly platform with a pure black background.  Everything is composed of the same gray stone or concrete-like material.  There are prominent shadows cast from the terrian and the floating structures on each other and on the platform.  There are some prominent sharp-looking edges on the elongated floating structure in the foreground."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
