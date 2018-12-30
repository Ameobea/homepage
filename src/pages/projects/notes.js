import React from 'react';
import { graphql, StaticQuery, Link } from 'gatsby';

import Layout from '../../components/layout';
import { ANewTab, BannerImage } from '../../components/util';

const Notes = ({ bannerImage }) => (
  <Layout
    title="Notes"
    description="An overview of my web-based MIDI editor and synthesizer"
  >
    <center>
      <h2>Web-based MIDI Editor and Synthesizer</h2>
      <BannerImage
        img={bannerImage}
        alt="A screenshot of the notes application showing the MIDI editor with some drawn and selected notes"
      />
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
    <h2>MIDI Editor</h2>
    <p>
      The MIDI editor interface is rendered as a SVG element. Its entire layout
      is calculated in Rust, and it is drawn/updated via shim functions exported
      from JavaScript. I went with SVG because it allows elements to be resized,
      deleted, and created individually without forcing the entire UI to
      re-render. Since the UI usually only changes slightly with each
      modification (one note added, etc.), this makes performance very good in
      the base case since we don&apos;t have to constantly re-render every
      frame.
    </p>
    <p>
      Raw mouse and keyboard events are passed to Rust and handled entirely
      there. There are keyboard shortcuts implemented for a variety of actions
      such as moving notes, copy-pasting selections, and playing back the
      current composition. State is maintained for a set of selected notes which
      can be selected by clicking and dragging while holding shift or
      control-selecting individual notes. The goal was to make the editing
      experience as efficient as possible and give users access to higher-level
      methods of manuipulating the note data.
    </p>
    <h3>Note Data Representation</h3>
    <p>
      Note data is stored internally in skip lists, one for each note line. I
      chose this data structure due to the fact that we the majority of
      operations are random insertions and deletions triggered when users modify
      notes in the middle of a composition. It also supports
      &quot;stabbing&quot; queries, where the goal is to either find what note
      intersects a given beat or what notes bound it if there are no
      intersections.
    </p>
    <p>
      Along the same, I created a really neat text-based representation of the
      skip list which is printed to the console in debug mode:{' '}
    </p>
    <pre style={{ overflow: 'hidden', maxWidth: '90vw' }}>
      |15, 16|--------------------->|21, 21|--------------------->x
      <br />
      |15, 16|->|17, 17|----------->|21, 21|--------------------->x
      <br />
      |15, 16|->|17, 17|----------->|21, 21|->|22, 23|----------->x
      <br />
      |15, 16|->|17, 17|->|19, 20|->|21, 21|->|22, 23|->|25, 26|->x
      <br />
      |15, 16|->|17, 17|->|19, 20|->|21, 21|->|22, 23|->|25, 26|->x
    </pre>
    <h2>Synthesizer Settings UI</h2>
    <p>
      The UI for the synthesizer controls is implemented using{' '}
      <Link to="/projects/react-control-panel/">
        <code>react-control-panel</code>
      </Link>
      , my React port of the{' '}
      <ANewTab
        to="https://github.com/freeman-lab/control-panel"
        text={<code>control-panel</code>}
      />{' '}
      project. Changing values affects the synthesizer live, being applied to
      all of the underlying voices individually.
    </p>
    <h2>Synthesizer</h2>
    <p>
      The first part of the current application is the synthesizer built using
      the <ANewTab to="https://tonejs.github.io/" text="Tone.JS" /> library.
      Tone.JS is a thin-ish wrapper over WebAudio that includes a bunch of handy
      stuff like a polyphonic synth manager (lets you play more than one note at
      the same time) and pre-built audio effects like filters. Since I used Rust
      and WebAssembly to implement the core of the application and Tone.JS is a
      JavaScript library, it was necessary to set up some shims for calling into
      Tone.JS from Rust. However, once that was finished, notes could be played
      by simply calling a function.
    </p>
    <p>
      As it turned out, the default Polyphonic synthesizer built into Tone.JS
      had some issues when used to dynamically play notes such as when users
      seleted them on the editor. Voices (underlying monophonic synths) were
      getting re-used before the note they last played finished, leading to
      permananently playing notes and audio artifacts. To get around this, I
      implemented my own polyphonic synth state manager in Rust that uses the
      least-recently-used voice first. I combined this with a static scheduling
      algorithm that pre-calculated the optimal order in which to use voices in
      order to maximize the time between release and the next attack. This is
      used in the playback feature to schedule attacks/releases on individual
      voices all at once.
    </p>
    <h2>Saving + Exporting</h2>
    <p>
      Whenevery they are played, compositions are serialized into a binary
      format and Base64-encoded (all from Rust) and then saved into the
      browser&apos;s <code>localStorage</code>. Saved compositions are loaded
      during application initialization if they exist. In the future, the goal
      is to allow import/export from MIDI files and perhaps even MIDI keyboards
      using{' '}
      <ANewTab to="https://webaudio.github.io/web-midi-api/" text="WebMIDI" />.
    </p>
    <h2>Future Work</h2>
    <p>
      This project is still very much WIP, and there's a lot left to do. For
      example, scrolling/zooming compsitions is still unimplemented (and may be
      a possible performance bottleneck). As previously mentioned, import/export
      to MIDI is missing as well. A help guide, more UI controls for stuff like
      BPM, more ergonomic behavior for playback, and a variety of other things
      are also missing. My goal with this isn&apos;t to create an all-inclusing
      web-based music production environment; I want to create an effective MIDI
      editor and synthesizer capable of allowing users to write and play back
      compositions. I may embed it into a large application or add more features
      later on.
    </p>
  </Layout>
);

const query = graphql`
  query {
    bannerImage: file(relativePath: { eq: "projects/notes/notes.png" }) {
      childImageSharp {
        fluid {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`;

export default () => <StaticQuery query={query} render={Notes} />;
