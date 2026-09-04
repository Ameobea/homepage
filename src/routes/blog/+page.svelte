<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';
  import rssIcon from '$lib/images/rss.svg';

  let { data } = $props();
</script>

<PageLayout title="Blog" description="The personal technical blog of Casey Primozic" maxWidth={860}>
  <h1 class="blog-header">
    <span>Casey Primozic's Blog</span>
    <a href="/rss.xml"><img src={rssIcon} alt="RSS feed" /></a>
  </h1>

  <ul class="post-links">
    {#each data.posts as { title, date, url } (url)}
      <li>
        <a href={url}>{title}</a>
        - <span class="post-date">{date.slice(0, 10)}</span>
      </li>
    {/each}
  </ul>
</PageLayout>

<style>
  .blog-header {
    display: flex;
    justify-content: center;
    align-items: last baseline;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .blog-header span {
    padding-right: 10px;
    font-size: 28px;
  }

  .blog-header a {
    display: flex;
  }

  .blog-header img {
    height: 24px;
    width: 24px;
    margin-bottom: 5px;
    margin-top: -13px;
  }

  .post-links {
    display: flex;
    flex-direction: column;
    padding: 10px 20px;
  }

  .post-links li {
    padding-top: 3px;
    padding-bottom: 6px;
    font-size: 17px;
    list-style-type: square;
  }

  .post-date {
    color: #676e6e;
  }
</style>
