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

<img-comparison-slider style="width: 100%">
  <img
    style="width: 100%"
    slot="first"
    src="/depth_based_fragment_culling/diffuse.jpg"
    loading="lazy"
    alt="Screenshot of the fully textured final output of my scene from the exact same angle as the depth pass"
  />
  <img
    style="width: 100%"
    slot="second"
    src="/depth_based_fragment_culling/depth.jpg"
    loading="lazy"
    alt="The output of the depth pass for my scene displayed as RGBA.  These is a lot of banding and strange artifacts visible"
  />
</img-comparison-slider>

<style>
  :global(body) {
    overflow: hidden;
  }
</style>
