<script lang="ts">
  import github from '$lib/images/social/github.svg';
  import reddit from '$lib/images/social/reddit.svg';
  import twitter from '$lib/images/social/twitter.svg';
  import mastodon from '$lib/images/social/mastodon.svg';
  import linkedin from '$lib/images/social/linkedin.svg';

  const logos: [string, string, string][] = [
    [github, 'https://github.com/ameobea', 'Github logo with transparent background'],
    [reddit, 'https://reddit.com/u/ameobea', 'Reddit logo with transparent background'],
    [twitter, 'https://twitter.com/ameobea10', 'Twitter logo with transparent background'],
    [mastodon, 'https://mastodon.ameo.dev/@ameo', 'Mastodon logo'],
    [
      linkedin,
      'https://www.linkedin.com/in/casey-primozic-1712a3120/',
      'Linked log with transparent background',
    ],
  ];
</script>

<div class="wrapper">
  <div class="header">
    <div class="logos">
      {#each logos as [logo, url, alt] (url)}
        <a class="logo-link" href={url} target="_blank" rel="noopener noreferrer">
          <img src={logo} {alt} height={16} />
        </a>
      {/each}
    </div>
    <div class="right">
      <a href="/imprint/">Imprint</a>
    </div>
  </div>
</div>

<style>
  .wrapper {
    background: rgb(44, 44, 44);
    display: flex;
  }

  .header {
    margin: 0 auto;
    padding: 0.25rem;
    display: flex;
    flex: 1;
    flex-direction: row;
  }

  .logos {
    display: flex;
    flex: 1;
    padding-right: 2px;
  }

  .logo-link {
    display: inline;
    padding: 0 6px;
  }

  .logo-link img {
    margin: 6px 0 0;
  }

  .right {
    display: flex;
    flex: 0.2;
    justify-content: flex-end;
    font-style: italic;
  }

  .right a {
    padding: 1px 4px 0;
  }
</style>
