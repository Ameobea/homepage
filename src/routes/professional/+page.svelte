<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';

  let { data } = $props();
</script>

<PageLayout title="Professional Experience" description="Work experience and professional skills">
  <center>
    <a class="resume-link" href="https://ameo.dev/resume-2024.pdf" target="_blank" rel="noopener">
      Download Resume
    </a>
  </center>
  <br />
  <br />

  <div class="section-title"><h2>Education</h2></div>
  <div class="section">
    <p>
      Graduated from
      <a href="https://valpo.edu/" target="_blank" rel="noopener noreferrer">Valparaiso University</a>
      undergraduate class of 2018 with a Bachelors of Science degree.
    </p>
    <ul>
      <li>Major in Computer Science</li>
      <li>Minor in French</li>
    </ul>
  </div>

  <div class="section-title"><h2>Work Experience</h2></div>
  <div class="section">
    {#each data.workExperience as job (job.company + job.startDate)}
      <div>
        <span class="company">
          {#if job.website}
            <a href={job.website} target="_blank" rel="noopener noreferrer">{job.company}</a>
          {:else}
            {job.company}
          {/if}
        </span>, {job.location} - <i>{job.title}</i> -
        <span class="date">{job.startDate} - {job.endDate}</span>
        {#if job.descriptions}
          <ul>
            {#each job.descriptions as description}
              <li>{description}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>
</PageLayout>

<style>
  .resume-link {
    font-size: 22px;
  }

  .section-title {
    text-align: center;
  }

  .section {
    margin-bottom: 50px;
  }

  .company {
    font-size: 22px;
    font-weight: bold;
  }

  .date {
    color: #525959;
  }
</style>
