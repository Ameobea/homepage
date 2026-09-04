<script lang="ts">
  const links: [string, string][] = [
    ['/portfolio/', 'Portfolio'],
    ['/contact/', 'Contact'],
    ['/blog/', 'Blog'],
    ['/professional/', 'Professional Experience'],
  ];
</script>

<div class="site-header">
  <a href="/" class="home-link"><b>cprimozic.net</b></a>
  <div class="nav-links">
    <a href="https://twitter.com/ameobea10/" target="_blank" rel="noopener" class="nav-link">
      @ameobea10
    </a>
    {#each links as [href, text] (href)}
      •<a class="nav-link" {href}>{text}</a>
    {/each}
  </div>
</div>

<style>
  .site-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    max-width: 880px;
    margin: 0 auto 6px;
    padding-left: 8px;
    padding-right: 2px;
  }

  .nav-links {
    display: flex;
    flex: 1;
    justify-content: flex-end;
    margin-top: 2px;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }

  .home-link {
    display: flex;
    flex: 0.4 1 0%;
    font-size: 30px;
    font-weight: 600;
    text-decoration: none;
    color: #17dccb;
  }

  .home-link:hover {
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 2px;
  }

  .nav-link {
    font-size: 18px;
    padding-left: 8px;
    padding-right: 8px;
    color: #17dccb;
    text-decoration: none;
  }

  .nav-link:last-child {
    flex-basis: 215px;
  }

  .nav-link:hover {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 1px;
  }
</style>
