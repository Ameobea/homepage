<script lang="ts">
  import 'katex/dist/katex.min.css';
  import './post.css';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import rssIcon from '$lib/images/rss.svg';

  let { data } = $props();
  const { post, head } = $derived(data);
</script>

<PageLayout
  title={post.title}
  description={head.description}
  siteName="Casey Primozic's Blog"
  image={head.image}
  meta={head.meta}
  maxWidth={880}
  triangles={false}
>
  <div class="blog-post">
    <h1>{post.title}</h1>
    <time class="published-at" datetime={post.date}>{post.date.slice(0, 10)}</time>
    <div class="above-fold-content">
      <a href="/rss.xml" class="rss-link">
        Subscribe to Blog via RSS
        <img src={rssIcon} alt="" />
      </a>
    </div>
    <div class="spacer" style="height: 6px"></div>

    {#if post.toc}
      <div class="markdown-remark-toc-wrapper">
        <div class="markdown-remark-toc">{@html post.toc}</div>
      </div>
    {/if}
    {@html post.html}
  </div>
</PageLayout>
