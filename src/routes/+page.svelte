<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';
  import IndexHeader from '$lib/components/IndexHeader.svelte';
  import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
  import Spotify from '$lib/components/spotify/Spotify.svelte';

  let { data } = $props();

  const linkBlocks: [string, string][] = [
    ['/portfolio/', 'Projects + Work Portfolio'],
    ['/blog/', 'Blog'],
    ['/contact/', 'Contact'],
    ['/professional/', 'Professional Skills and Experience'],
    ['/notes/', 'Notes'],
  ];
</script>

<IndexHeader />
<PageLayout showHeader={false} description="The homepage of Casey Primozic / Ameo">
  <div class="title">
    <h1 class="headline">Casey Primozic // ameo</h1>
    <div class="profile-picture">
      <ResponsiveImage
        entry={data.face}
        alt="A picture of Casey Primozic (Ameo)"
        maxWidth={250}
        loading="eager"
      />
    </div>
  </div>

  <div class="tag-line">
    I'm a software developer interested in all kinds of programming. I love building
    <a href="/portfolio/">web applications</a> and creating tools that people find useful.
  </div>

  <div class="link-blocks">
    {#each linkBlocks as [href, text] (href)}
      <a class="link-block" {href}><div class="link-block-content">{text}</div></a>
    {/each}
  </div>

  <Spotify data={data.spotify} />

  <a style="display: none" rel="me" href="https://mastodon.ameo.dev/@ameo">Mastodon</a>
</PageLayout>

<style>
  .title {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    justify-content: center;
    align-items: center;
    padding-bottom: 40px;
    flex-wrap: wrap;
  }

  .headline {
    padding-left: 1.25rem;
    text-align: center;
  }

  .profile-picture {
    flex-basis: 125px;
    min-width: 110px;
    margin-bottom: 1.45rem;
  }

  .profile-picture :global(img) {
    aspect-ratio: 1;
    object-fit: cover;
    object-position: 1px -1px;
    clip-path: circle(49% at center 50%);
  }

  .tag-line {
    font-size: 18px;
    padding-bottom: 14px;
  }

  .link-blocks {
    display: flex;
    flex: 1;
    justify-content: space-evenly;
    flex-wrap: wrap;
  }

  .link-block {
    display: flex;
    flex: 0;
    text-align: center;
    font-size: 24px;
    color: #aaa;
  }

  .link-block-content {
    display: flex;
    flex: 0;
    justify-content: center;
    align-items: center;
    min-width: 250px;
    height: 150px;
    margin: 25px;
    padding: 0 12px;
    border: 1px solid rgba(200, 200, 200, 0.4);
    font-weight: bold;
    line-height: 1.25em;
    color: #aaa;
    background-color: rgba(200, 200, 200, 0.06);
  }

  .link-block-content:hover {
    background-color: rgba(200, 200, 200, 0.1);
  }
</style>
