<script lang="ts">
  import type { Snippet } from 'svelte';
  import { assets } from '$app/paths';

  interface Props {
    image: string | null;
    alt: string;
    children: Snippet;
  }

  let { image, alt, children }: Props = $props();
</script>

<div class="root">
  <div class="track">
    {#if image}
      <picture class="image-wrapper">
        <source type="image/avif" srcset="{assets}{image}.avif" />
        <img
          src="{assets}{image}.webp"
          {alt}
          width={160}
          height={160}
          loading="lazy"
          decoding="async"
        />
      </picture>
    {:else}
      <div class="image-wrapper placeholder"></div>
    {/if}
    <div class="content">{@render children()}</div>
  </div>
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    flex-basis: 160px;
    height: 160px;
    margin-bottom: 30px;
    margin-right: 10px;
    font-size: 14px;
    align-items: center;
    color: white;
  }

  .track {
    position: relative;
    z-index: 1;
  }

  .image-wrapper {
    position: absolute;
    width: 160px;
    height: 160px;
    z-index: -1;
    opacity: 0.35;
    transition: opacity 0.4s;
  }

  .image-wrapper img {
    display: block;
    width: 160px;
    height: 160px;
    margin: 0;
  }

  .placeholder {
    background-color: #232323;
  }

  .track:hover .image-wrapper {
    opacity: 1;
  }

  .content {
    display: flex;
    flex-direction: column;
    height: 160px;
  }

  .content :global(.track-datum) {
    z-index: 2;
    padding: 4px;
    width: 160px;
    height: 160px;
    transition: mix-blend-mode 0.4s;
  }

  .track:hover :global(.track-datum) {
    mix-blend-mode: exclusion;
  }

  .content :global(.track-datum a) {
    color: white;
  }
</style>
