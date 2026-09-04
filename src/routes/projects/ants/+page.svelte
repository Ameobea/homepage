<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';
  import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';

  let { data } = $props();
</script>

<PageLayout
  title="Ant Colony Simulation"
  description="About my ant colony simulation project - an agent-based simulation built using Minutiae as a school project"
>
  <ResponsiveImage
    entry={data.images['ants.png']}
    alt="A screenshot of the ant colony simulation interface"
  />
  I created this ant colony simulation as my final project for the Simulation and Modeling class
  that I took in my last year of college. It was written in Rust and compiled to WebAssembly so that
  it could run in the browser, rendering to a HTML canvas via WebGL. I created a slideshow and paper
  as part of the project and have included links to them below.
  <br />
  <br />
  <a href="https://i.ameo.link/64s.pdf" target="_blank" rel="noopener noreferrer"
    >Presentation Slides</a
  >
  <br />
  <a href="https://i.ameo.link/64t.pdf" target="_blank" rel="noopener noreferrer">Paper</a>
</PageLayout>
