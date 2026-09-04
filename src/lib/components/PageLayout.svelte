<script lang="ts">
  import type { Snippet } from 'svelte';
  import { assets } from '$app/paths';
  import Header from './Header.svelte';
  import HeaderMobile from './HeaderMobile.svelte';

  const SITE_TITLE = "Casey Primozic's Homepage";
  const trianglesDir =
    (
      Object.values(
        import.meta.glob('/src/lib/generated/triangles.json', { eager: true })
      )[0] as { default: { dir: string } } | undefined
    )?.default.dir ?? '/triangles';

  interface Props {
    title?: string;
    description?: string;
    siteName?: string;
    image?: string | null;
    meta?: { name: string; content: string }[];
    showHeader?: boolean;
    maxWidth?: number;
    /** The wasm background animation; a plain module script so it needs no hydration */
    triangles?: boolean;
    children: Snippet;
  }

  let {
    title,
    description,
    siteName = 'Homepage of Casey Primozic / ameo',
    image = null,
    meta = [],
    showHeader = true,
    maxWidth = 1080,
    triangles = true,
    children,
  }: Props = $props();

  const isOpenGraph = (name: string) => name.startsWith('og:') || name.startsWith('article:');
</script>

<svelte:head>
  <title>{title ? `${title} - ${SITE_TITLE}` : SITE_TITLE}</title>
  <meta property="og:title" content={title ?? SITE_TITLE} />
  <meta property="og:site_name" content={siteName} />
  {#if description}
    <meta property="og:description" content={description} />
    <meta name="description" content={description} />
  {/if}
  {#if image}
    <meta property="og:image" content={image} />
  {/if}
  <meta name="keywords" content="Casey Primozic, Ameo, AmeoBea" />
  <meta name="twitter:site" content="ameobea10" />
  <meta name="twitter:creator" content="ameobea10" />
  <meta name="twitter:title" content={title ?? SITE_TITLE} />
  {#each meta as { name, content }}
    {#if isOpenGraph(name)}
      <meta property={name} {content} />
    {:else}
      <meta {name} {content} />
    {/if}
  {/each}
  {#if triangles}
    <script type="module" src="{assets}{trianglesDir}/triangles.js"></script>
  {/if}
</svelte:head>

{#if showHeader}
  <HeaderMobile />
  <Header />
{/if}

<div class="page-root" style:max-width="{maxWidth}px">
  {@render children()}
</div>

<style>
  .page-root {
    margin: 0 auto;
    padding: 1.45rem 1.0875rem;
    background-color: rgb(24, 24, 24);
  }
</style>
