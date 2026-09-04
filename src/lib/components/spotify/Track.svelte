<script lang="ts">
  import ImageBox from './ImageBox.svelte';
  import { player } from './player.svelte';
  import type { SpotifyTrack } from '$lib/spotify';
  import playIcon from '$lib/images/PlayIcon.svg';
  import pauseIcon from '$lib/images/PauseIcon.svg';

  let { track }: { track: SpotifyTrack } = $props();

  let audio = $state<HTMLAudioElement>();
  const isPlaying = $derived(track.previewUrl !== null && player.playing === track.previewUrl);

  $effect(() => {
    if (!audio) {
      return;
    }
    audio.volume = 0.2;
    if (isPlaying) {
      audio.play().catch(() => (player.playing = null));
    } else {
      audio.pause();
    }
  });

  const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max)}…` : s);
  const artistNames = $derived(track.artists.map((a) => a.name).join(', '));
</script>

<ImageBox image={track.image} alt="Album art for {track.title} on {track.album} by {artistNames}">
  <div class="track-datum">
    <div>{truncate(track.title, 50)}</div>
    <div>{track.album}</div>
    <span>
      {#each track.artists as artist, i (artist.url)}
        <a href={artist.url}>{artist.name}</a>{#if i !== track.artists.length - 1}{', '}{/if}
      {/each}
    </span>
    {#if track.previewUrl}
      <audio
        preload="none"
        bind:this={audio}
        src={track.previewUrl}
        onended={() => (player.playing = null)}
      ></audio>
    {/if}
  </div>
  {#if track.previewUrl}
    <button
      class="play-pause"
      onclick={() => (player.playing = isPlaying ? null : track.previewUrl)}
      aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
    >
      <img src={isPlaying ? pauseIcon : playIcon} alt="" />
    </button>
  {/if}
</ImageBox>

<style>
  .play-pause {
    display: flex;
    padding: 4px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .play-pause img {
    width: 20px;
    height: 20px;
    margin: 0;
  }
</style>
