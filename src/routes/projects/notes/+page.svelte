<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';
  import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';

  let { data } = $props();
</script>

<PageLayout
  title="web synth"
  description="An overview of my web-based audio synthesis experimentation platform"
>
  <center>
    <h2>Web-based MIDI Editor and Synthesizer</h2>
    <ResponsiveImage
      entry={data.images['notes/notes.png']}
      alt="A screenshot of the notes application showing the MIDI editor with some drawn and selected notes"
      style="margin-bottom: 40px"
    />
  </center>
  <p>
    I'd been exploring the
    <a
      href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API"
      target="_blank"
      rel="noopener noreferrer">WebAudio API</a
    >
    and the various things that people have made with it. I was blown away by awesome demos such as
    this
    <a href="http://amid.fish/javascript-karplus-strong" target="_blank" rel="noopener noreferrer"
      >Karplus-Strong synthesis demo</a
    >
    and this
    <a
      href="https://noisehack.com/custom-audio-effects-javascript-web-audio-api/"
      target="_blank"
      rel="noopener noreferrer">Collection of WebAudio effects</a
    >, and I wanted to try it out for myself.
  </p>
  <p>
    This project started out as a web-based MIDI editor with a very simple synthesizer using
    existing audio WebAudio-based libraries. Since then, it has grown into an extensive collection
    of modules covering a wide range of functionality including several types of synthesizers,
    audio effects, noise generators, sequencers, audio visualizations and analyzers, a sample
    library, and audio graph management to name some.
  </p>
  <ResponsiveImage
    entry={data.images['notes/filter-designer.png']}
    alt="A screenshot of filter designer module from web synth showing a frequency response plot for two biquad filters"
    style="margin-bottom: 40px"
  />
  <p>
    The project is still under very active development, and the best place to go for an up-to-date
    overview and demo is the Github repository:
    <a href="https://github.com/ameobea/web-synth" target="_blank" rel="noopener noreferrer">
      https://github.com/ameobea/web-synth
    </a>
  </p>
  <h2>Related Projects</h2>
  <p>
    Web synth is a collection of connected modules and sub-projects that all run in the web browser
    by using WebAudio. While working on it, there have been a couple of pieces that have grown to
    become more full-fledged projects themselves.
  </p>
  <h3>FM Synthesizer</h3>
  <ResponsiveImage
    entry={data.images['notes/fm-synth.png']}
    alt="A screenshot of the browser-based FM synth project that developed as an offshoot of web synth"
    style="margin-bottom: 40px"
  />
  <p>
    Try it yourself:
    <a href="https://notes.ameo.design/fm.html" target="_blank" rel="noopener noreferrer">
      https://notes.ameo.design/fm.html
    </a>
  </p>
  <p>
    While experimenting with FM synthesis, I ended up creating a pretty capable FM synthesizer. It's
    integrated into web synth allowing it to interoperate with all of the modules and exist as a
    fully controllable part of the audio graph. In addition, I created a standalone page for it with
    a more minimal UI focused on showing off its capabilities with a variety of presets and making
    it easier for people to try it out without having to spend time learning how to use the full
    web synth platform.
  </p>
  <h3>Docs + Audio Programming / DSP Notes</h3>
  <p>
    I had the goal of creating a docs website for web synth and related materials as well as keep
    track of things I learned and discovered as I started to get deeper into audio programming and
    DSP development. I discovered a tool called
    <a href="https://github.com/foambubble/foam" target="_blank" rel="noopener noreferrer">Foam</a>
    which is a note-taking and knowledgebase generator that uses VS Code and generates static HTML
    from markdown.
  </p>
  <p>
    Since creating it, I've been steadily adding to it and expanding it with both usage guides and
    documentation for web synth as well as random notes. Check it out here:
    <a href="https://notes.ameo.design/docs/" target="_blank" rel="noopener noreferrer">
      https://notes.ameo.design/docs
    </a>
  </p>
</PageLayout>
