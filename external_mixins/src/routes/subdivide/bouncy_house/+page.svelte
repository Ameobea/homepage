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

<img-comparison-slider style="max-height: 100vh" value="38">
	<img
		style="width: 100%"
		slot="first"
		src="https://i.ameo.link/c8u.jpg"
		loading="lazy"
		alt="A screenshot of a scene rendered with Three.JS.  There are several floating platforms made up of rectangular prisms floating over a void. The background is pure black."
	/>
	<img
		style="width: 100%"
		slot="second"
		src="https://i.ameo.link/c8v.jpg"
		loading="lazy"
		alt="A screenshot of a scene rendered with Three.JS.  There are several floating platforms made out of puffed-up-looking rectangular prisms floating over a void. They look like they've been inflated with air, kind of like a bouncy house. The background is pure black."
	/>
</img-comparison-slider>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
