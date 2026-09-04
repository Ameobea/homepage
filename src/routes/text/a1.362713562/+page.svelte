<script lang="ts">
  import { onMount } from 'svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';

  const A1362713562 = 'A1.362713562';
  const SYMBOLS = '╜φ°⌂▌╫§╜';
  const FLUME_MIXTAPE_VIDEO_URL = 'https://youtu.be/7TML_MTQdg4?t=206';

  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

  let value = $state('');
  let headerText = $state(A1362713562);

  onMount(() => {
    const handle = setInterval(() => {
      if (Math.random() > 0.2) {
        return;
      }
      const index = randInt(0, headerText.length);
      const char =
        Math.random() > 0.5
          ? SYMBOLS[randInt(0, SYMBOLS.length)]
          : A1362713562[randInt(0, A1362713562.length)];
      headerText = headerText.slice(0, index) + char + headerText.slice(index + 1);
    }, 21);
    return () => clearInterval(handle);
  });

  $effect(() => {
    if (value.toUpperCase() === A1362713562) {
      window.location.replace(FLUME_MIXTAPE_VIDEO_URL);
    }
  });
</script>

<PageLayout>
  <h1 style="font-family: 'Oxygen Mono', 'Hack', monospace">{headerText}</h1>
  <input type="text" bind:value />
  <i>300 ZEDEX</i>
</PageLayout>
