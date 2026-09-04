<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';
  import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';

  let { data } = $props();
</script>

<PageLayout
  title="Portfolio"
  description="Software development project portfolio of Casey Primozic / Ameo"
>
  <center>
    <h1>Software Project Portfolio</h1>
  </center>
  <p>
    Writing software is my passion. Building web applications, websites, tools, utilities, or artsy
    code sketches is what I do in my free time and want to do for my career as well. Here is a
    collection of the notable software projects that I've undertaken and published. The list isn't
    comprehensive and is always growing.
  </p>
  <hr />

  {#each data.projects as project, i (project.name)}
    <div class="project" class:even={i % 2 === 0}>
      <div class="content">
        <div class="header">
          <h2 class="title">{project.name}</h2>
          <i class="info-link">{project.startDate} - {project.endDate || '(current)'}</i>
          <div class="info">
            {#if project.pageUrl}
              <span class="info-link"><a href={project.pageUrl}>Details</a></span>
            {/if}
            {#if project.projectUrl}
              <span class="info-link">
                <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">Website</a>
              </span>
            {/if}
            {#if project.srcUrl}
              <span class="info-link">
                <a href={project.srcUrl} target="_blank" rel="noopener noreferrer">Source Code</a>
              </span>
            {/if}
            {#if project.videoUrl}
              <span class="info-link">
                <a href={project.videoUrl} target="_blank" rel="noopener noreferrer">Video</a>
              </span>
            {/if}
          </div>
        </div>
        <p class="description">{project.description}</p>
      </div>

      {#if project.imageEntry}
        {#if project.pageUrl}
          <a class="image-wrapper" href={project.pageUrl}>
            <ResponsiveImage entry={project.imageEntry} alt={project.imageAlt ?? ''} maxWidth={450} />
          </a>
        {:else}
          <div class="image-wrapper">
            <ResponsiveImage entry={project.imageEntry} alt={project.imageAlt ?? ''} maxWidth={450} />
          </div>
        {/if}
      {/if}
    </div>
  {/each}
</PageLayout>

<style>
  .project {
    display: flex;
    flex: 1;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 8px 12px;
    background: rgb(18, 18, 18);
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
    margin-bottom: 8px;
    margin-top: 10px;
  }

  .project.even {
    flex-direction: row-reverse;
  }

  .content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .header {
    padding-bottom: 6px;
  }

  .title {
    margin-bottom: 4px;
  }

  .info {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .info-link {
    display: flex;
    font-family: 'IBM Plex Sans', 'PT Sans', 'Open Sans', 'Roboto', sans-serif;
    color: #999;
    font-size: 14px;
    line-height: 1.4em;
    padding-right: 10px;
  }

  .description {
    padding-top: 4px;
    font-size: 17px;
    white-space: pre-wrap;
  }

  .image-wrapper {
    display: flex;
    flex: 0;
    flex-basis: 360px;
    align-items: center;
  }

  .image-wrapper :global(img) {
    max-height: 400px;
    object-fit: contain;
  }

  @media only screen and (max-width: 600px) {
    .image-wrapper {
      min-width: 80vw;
    }
  }

  @media only screen and (min-width: 600px) {
    .image-wrapper {
      min-width: 450px;
    }

    .project.even .image-wrapper {
      padding-right: 14px;
    }

    .project:not(.even) .image-wrapper {
      padding-left: 14px;
    }

    .content {
      min-width: 300px;
    }
  }
</style>
