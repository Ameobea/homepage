<script lang="ts">
  import hamburger from '$lib/images/hamburgerMenu.svg';

  const links: [string, string][] = [
    ['/', 'Home'],
    ['/portfolio/', 'Portfolio'],
    ['/contact/', 'Contact'],
    ['/blog/', 'Blog'],
    ['/professional/', 'Professional Experience'],
  ];
</script>

<div class="header-mobile">
  <details class="menu">
    <summary aria-label="Toggle navigation menu">
      <img height={38} width={38} src={hamburger} alt="" />
    </summary>
    <nav>
      {#each links as [href, text] (href)}
        <a {href}>{text}</a>
      {/each}
    </nav>
  </details>

  <div class="links">
    <div class="title"><a href="/">cprimozic.net</a></div>
    <div class="title">|</div>
    <div class="title">
      <a href="https://twitter.com/ameobea10/" target="_blank" rel="noopener">@ameobea10</a>
    </div>
  </div>
</div>

<style>
  .header-mobile {
    background-color: rgba(16, 16, 16, 0.92);
    border-bottom: 1px solid rgba(200, 200, 200, 0.4);
    display: none;
    height: 45px;
    position: relative;
  }

  .menu {
    position: absolute;
    left: 7px;
    top: 4px;
    z-index: 10;
  }

  .menu summary {
    display: block;
    cursor: pointer;
    list-style: none;
    line-height: 0;
  }

  .menu summary::-webkit-details-marker {
    display: none;
  }

  .menu summary img {
    display: block;
    margin: 0;
  }

  .menu nav {
    position: absolute;
    top: 4px;
    left: 52px;
    width: 150px;
    background-color: rgb(45, 45, 45);
    border: 1px solid rgba(200, 200, 200, 0.4);
    border-bottom-width: 0;
    display: flex;
    flex-direction: column;
    z-index: 200;
  }

  .menu nav a {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px 8px;
    font-size: 20px;
    line-height: 1.2;
    border-bottom: 1px solid rgba(200, 200, 200, 0.4);
    text-align: center;
  }

  .links {
    padding-left: 40px;
    display: flex;
    flex-direction: row;
    flex: 1;
    justify-content: center;
    gap: 12px;
  }

  .title {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-family: 'IBM Plex Sans', 'PT Sans', 'Open Sans', 'Roboto', sans-serif;
    font-weight: 600;
  }

  .title a {
    color: #17dccb;
    text-decoration: none;
  }
</style>
