import React from 'react';
import { StaticImage } from 'gatsby-plugin-image';

import Layout from '../../components/layout';
import { ANewTab } from '../../components/util';

const Notes = () => (
  <Layout
    title="web synth"
    description="An overview of my web-based audio synthesis experimentation platform"
  >
    <center>
      <h2>Web-based MIDI Editor and Synthesizer</h2>
      <span style={{ textAlign: 'center' }}>
        <StaticImage
          style={{ marginBottom: 40 }}
          src="../../images/projects/notes/notes.png"
          alt="A screenshot of the notes application showing the MIDI editor with some drawn and selected notes"
          formats={['auto', 'webp', 'avif']}
        />
      </span>
    </center>
    <p>
      I&apos;d been exploring the{' '}
      <ANewTab
        to="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API"
        text="WebAudio API"
      />{' '}
      and the various things that people have made with it. I was blown away by
      awesome demos such as this{' '}
      <ANewTab
        to="http://amid.fish/javascript-karplus-strong"
        text="Karplus-Strong synthesis demo"
      />{' '}
      and this{' '}
      <ANewTab
        to="https://noisehack.com/custom-audio-effects-javascript-web-audio-api/"
        text="Collection of WebAudio effects"
      />
      , and I wanted to try it out for myself.
    </p>
    <p>
      This project started out as a web-based MIDI editor with a very simple
      synthesizer using existing audio WebAudio-based libraries. Since then, it
      has grown into an extensive collection of modules covering a wide range of
      functionality including several types of synthesizers, audio effects,
      noise generators, sequencers, audio visualizations and analyzers, a sample
      library, and audio graph management to name some.
    </p>
    <span style={{ textAlign: 'center' }}>
      <StaticImage
        style={{ marginBottom: 40 }}
        src="../../images/projects/notes/filter-designer.png"
        alt="A screenshot of filter designer module from web synth showing a frequency response plot for two biquad filters"
        formats={['auto', 'webp', 'avif']}
      />
    </span>
    <p>
      The project is still under very active development, and the best place to
      go for an up-to-date overview and demo is the Github repository:{' '}
      <ANewTab to="https://github.com/ameobea/web-synth">
        https://github.com/ameobea/web-synth
      </ANewTab>
    </p>
    <h2>Related Projects</h2>
    <p>
      Web synth is a collection of connected modules and sub-projects that all
      run in the web browser by using WebAudio. While working on it, there have
      been a couple of pieces that have grown to become more full-fledged
      projects themselves.
    </p>
    <h3>FM Synthesizer</h3>
    <span style={{ textAlign: 'center' }}>
      <StaticImage
        style={{ marginBottom: 40 }}
        src="../../images/projects/notes/fm-synth.png"
        alt="A screenshot of the browser-based FM synth project that developed as an offshoot of web synth"
        formats={['auto', 'webp', 'avif']}
      />
    </span>
    <p>
      Try it yourself:{' '}
      <ANewTab to="https://notes.ameo.design/fm.html">
        https://notes.ameo.design/fm.html
      </ANewTab>
    </p>
    <p>
      While experimenting with FM synthesis, I ended up creating a pretty
      capable FM synthesizer. It's integrated into web synth allowing it to
      interoperate with all of the modules and exist as a fully controllable
      part of the audio graph. In addition, I created a standalone page for it
      with a more minimal UI focused on showing off its capabilities with a
      variety of presets and making it easier for people to try it out without
      having to spend time learning how to use the full web synth platform.
    </p>
    <h3>Docs + Audio Programming / DSP Notes</h3>
    <p>
      I had the goal of creating a docs website for web synth and related
      materials as well as keep track of things I learned and discovered as I
      started to get deeper into audio programming and DSP development. I
      discovered a tool called{' '}
      <ANewTab to="https://github.com/foambubble/foam">Foam</ANewTab> which is a
      note-taking and knowledgebase generator that uses VS Code and generates
      static HTML from markdown.
    </p>
    <p>
      Since creating it, I've been steadily adding to it and expanding it with
      both usage guides and documentation for web synth as well as random notes.
      Check it out here:{' '}
      <ANewTab to="https://notes.ameo.design/docs/">
        https://notes.ameo.design/docs
      </ANewTab>{' '}
    </p>
  </Layout>
);

export default Notes;
