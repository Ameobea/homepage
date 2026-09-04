<script lang="ts">
  import type { SpotifyData } from '$lib/spotify';
  import ImageBoxGrid from './ImageBoxGrid.svelte';
  import Track from './Track.svelte';
  import Artist from './Artist.svelte';

  let { data }: { data: SpotifyData } = $props();
</script>

<ImageBoxGrid title="My Recent Favorite Tracks on Spotify" items={data.tracks}>
  {#snippet item(track)}
    <Track {track} />
  {/snippet}
</ImageBoxGrid>

<ImageBoxGrid title="My Recent Favorite Artists on Spotify" items={data.artists}>
  {#snippet item(artist)}
    <Artist {artist} />
  {/snippet}
</ImageBoxGrid>
