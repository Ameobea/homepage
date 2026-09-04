<script lang="ts">
  import { fallbackSrc, originalUrl, sizesFor, srcset, type ImageEntry } from '$lib/images';

  interface Props {
    entry: ImageEntry;
    alt: string;
    maxWidth?: number;
    style?: string;
    loading?: 'lazy' | 'eager';
  }

  let { entry, alt, maxWidth = 1080, style = '', loading = 'lazy' }: Props = $props();

  const displayWidth = $derived(Math.min(entry.width, maxWidth));
  const sizes = $derived(sizesFor(displayWidth));
</script>

{#if entry.widths.length === 0}
  <img
    class="responsive-image"
    src={originalUrl(entry)}
    {alt}
    width={entry.width}
    height={entry.height}
    {loading}
    decoding="async"
    style="max-width: {displayWidth}px; {style}"
  />
{:else}
  <picture class="responsive-image" style="max-width: {displayWidth}px; {style}">
    <source type="image/avif" srcset={srcset(entry, 'avif')} {sizes} />
    <img
      src={fallbackSrc(entry, displayWidth)}
      srcset={srcset(entry, 'webp')}
      {sizes}
      {alt}
      width={entry.width}
      height={entry.height}
      {loading}
      decoding="async"
    />
  </picture>
{/if}

<style>
  .responsive-image {
    display: block;
    margin: 0 auto;
    width: 100%;
  }

  .responsive-image img {
    display: block;
    width: 100%;
    height: auto;
    margin: 0;
  }

  img.responsive-image {
    height: auto;
    margin: 0 auto;
  }
</style>
