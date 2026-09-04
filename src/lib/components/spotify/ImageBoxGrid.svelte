<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from 'svelte';
  import { TIMEFRAMES, type Timeframe } from '$lib/spotify';

  interface Props {
    title: string;
    items: Record<Timeframe, T[]>;
    initialItems?: number;
    maxItems?: number;
    item: Snippet<[T]>;
  }

  let { title, items, initialItems = 5, maxItems = 20, item }: Props = $props();

  let timeframe = $state<Timeframe>('short');
  let expanded = $state(false);
  const visible = $derived(items[timeframe].slice(0, expanded ? maxItems : initialItems));
</script>

<h3 class="header">{title}</h3>
<div class="timeframe-selector">
  Timeframe:
  {#each TIMEFRAMES as frame, i (frame)}
    <button class="timeframe" class:active={frame === timeframe} onclick={() => (timeframe = frame)}>
      {frame}
    </button>{#if i !== TIMEFRAMES.length - 1}&nbsp;•&nbsp;{/if}
  {/each}
</div>
<div class="grid">
  {#each visible as entry (entry.id)}
    {@render item(entry)}
  {/each}
</div>
{#if !expanded}
  <button class="show-more" onclick={() => (expanded = true)}>Show More</button>
{/if}

<style>
  .header {
    padding-top: 60px;
    padding-bottom: 10px;
    text-align: center;
  }

  .timeframe-selector {
    padding-bottom: 30px;
  }

  button {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .timeframe.active {
    font-weight: bold;
    font-size: 22px;
    cursor: default;
  }

  .grid {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
  }

  .show-more {
    display: block;
    margin: 0 auto;
    font-size: 21px;
  }
</style>
