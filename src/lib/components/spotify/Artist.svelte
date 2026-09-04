<script lang="ts">
  import ImageBox from './ImageBox.svelte';
  import type { SpotifyArtist } from '$lib/spotify';

  const PREFERRED_GENRES = new Set([
    'vapor twitch',
    'vapor soul',
    'art pop',
    'indie pop',
    'indietronica',
    'folk-pop',
    'chillwave',
  ]);
  const MAX_GENRES = 6;

  let { artist }: { artist: SpotifyArtist } = $props();

  const genres = $derived(
    [
      ...artist.genres.filter((g) => PREFERRED_GENRES.has(g)),
      ...artist.genres.filter((g) => !PREFERRED_GENRES.has(g)),
    ].slice(0, MAX_GENRES)
  );

  const genreUrl = (genre: string) =>
    `http://everynoise.com/engenremap-${genre.replace(/[ -]/g, '')}.html`;
</script>

<ImageBox image={artist.image} alt={artist.name}>
  <div class="track-datum">
    <div><a href={artist.url}>{artist.name}</a></div>
    <div>
      {#each genres as genre, i (genre)}
        <a href={genreUrl(genre)} target="_blank" rel="noopener noreferrer">{genre}</a
        >{#if i !== genres.length - 1}{', '}{/if}
      {/each}
    </div>
  </div>
</ImageBox>
