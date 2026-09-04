---
title: 'Building Modular Audio Nodes in Web Audio'
date: '2025-05-18'
description: "An overview of the patterns I've developed for building modules for my browser-based DAW and audio synthesis tool.  It outlines solutions for keeping state synchronized between threads, handling async initialization and message passing, and integration with UIs and visualizations."
imageWidth: 828
imageHeight: 1151
imageUrl: 'https://i.ameo.link/d21.png'
imageAlt: 'A sequence diagram showing the process of initializing an audio worklet processor that runs WebAssembly code.  It has three participants: Internet, UI Thread, and AWP.  It has events for things like fetching Wasm, sending messages back and forth between the AWP and the UI Thread, and handling user input.'
---

For the past several years, I've been working on and off on a browser-based DAW and audio synthesis tool which is still stuck with the placeholder name [Web Synth](https://synth.ameo.dev).

![A screenshot of web synth, running in the browser.  The graph editor module is active, which shows the connectivity between various nodes with names like "Synth Designer", "Mixer", and "Gain".  The Mixer node is selected and there's an audio mixer UI rendered on the right side of the screen with audio level visualizations rendered.  There are tabs along the top for switching between different modules, and they have names like "MIDI Keyboard", "MIDI Editor", "arp", and more.](./images/modular-audio-nodes/web-synth.png)

When the project first started off, it was a wrapper around native [Web Audio nodes](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode) with a MIDI editor.  As I continued to work on it, the platform gained more and more custom nodes and modules to add functionality beyond that which was built-in to Web Audio.

I've built dozens of different modules at this point.  There's a pretty wide variety:

 * Effects or audio processing nodes like distortion, delay/flanger/reverb, compressors, vocoders, etc.
 * Audio generation nodes like a granular synthesizer, wavetable synth, and sample choppers and loopers
 * Visualizations and analysis nodes like a signal analyzer consisting of spectrogram + oscilloscope (on which I've previously written [a dedicated post](https://cprimozic.net/blog/building-a-signal-analyzer-with-modern-web-tech/))
 * Misc. utility nodes like envelope generators, randomness/noise generators, math nodes, mixers, and stuff like that.

<div class="note padded">
Over time, I've developed some useful patterns for building these modules and supporting pieces for them like UIs and visualizations.
</div>

By having a consistent architecture to start from, I'm able to build them much more quickly and free up mental resources for the modules' features themselves rather than focusing on platform implementation details.  This also makes it much easier to make fixes or changes to modules, which is helpful when working with code I last touched 5+ years ago.

## High-Level Architecture

There are three functionalities that all modules have in common:

### Input/Output Registration

One unifying characteristic of all audio modules in my application is that they connect to or interact in some way with the Web Audio graph.  Modules can have zero or more inputs and zero or more outputs.  Even if a given module creates and connects multiple different native Web Audio nodes internally (a common case), it appears as a single node in the application and the graph view.

Each module declares what inputs and outputs it exposes and what type they are.  These connection descriptors (which I refer to in my code as `Connectables`) are managed by a part of the application I call the [patch network](https://synth.ameo.dev/docs/patch-network).  Given a target graph state or an action like connect or disconnect, it handles performing actions to actually update the audio graph and notify listeners of the change.

It's also possible to dynamically add or remove connections dynamically at runtime.  This is common when doing async initialization, in which case a placeholder node is swapped out for a real audio processing node when it's ready.

It's useful for nodes like mixers where inputs or outputs can be added as needed by the user.  The patch network handles disconnecting the old node and re-connecting the new one automatically when a module notifies it that its connectables have changed.

### Serialization + Deserialization

Another commonality between all modules is that they have persistent state from which they're initialized each time the application loads.  Each module implements a `serialize()` and `deserialize()` function so that they can be saved and re-constructed in the same state.

This also serves as the basis for the save file format for web synth.

<div class="good padded">
Once you define a serialization for every node/module in the application, you just need connectivity info and a little bit of metadata and you've got a serialization format for the whole thing.
</div>

And indeed that's how I implemented it.  A web synth composition is just a bunch of JSON representing the state of all the modules, the state of the patch network, and some extras like the currently selected module.  This makes saving and loading compositions trivial and adds the ability to easily inspect and edit save files.

This all seems obvious in hindsight, but it's key to keeping the application extensible.  Keeping the amount of global state low and concentrating what there is into a small region of code is very helpful.

### UIs + Visualizations

The final thing that (almost) every module needs is some way for users to control and interact with it.  Since the whole application is browser-based, I build all my modules' UIs with either React or Svelte.  The module-level interface for rendering UIs is quite low level and generic, though - it just says "render your UI into this div" and then "tear down your UI".

I defined a couple of helper functions to handle mounting and unmounting components for each Svelte and React.  I also make use of a fork that I created of a UI-builder library called [`react-control-panel`](https://github.com/Ameobea/react-control-panel) to build almost everything.  It produces UIs that look like this:

![An example of a typical control panel in web synth, created using react-control-panel and controlling a bitcrusher effect](https://i.ameo.link/8uv.png)

This keeps a unified look and feel between my various modules' UIs as well as saving a ton of time compared to building them all from scratch.

### Interface

Given those functionalities, I ended up with a module interface that looks like this:

```ts
interface WebSynthModule<State extends Record<string, any>> {
  new (
    ctx: AudioContext,
    id: string,
    initialState?: State
  ): WebSynthModule;

  serialize(): State;

  buildConnectables(): {
    inputs: Map<string, ConnectableInput>;
    outputs: Map<string, ConnectableOutput>;
  };

  renderUI: (domId: string) => void;
  cleanupUI: (domId: string) => void;
}
```

There are several more implementation details and niche pieces of functionality that I've left off, but that's the core of it.

## `AudioWorkletProcessor`

In web synth, pretty much every module that performs any kind of digital signal processing or custom audio processing code is implemented using an [`AudioWorkletProcessor`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor), or AWP.  AWPs are a way of running user-defined code directly on the audio thread, and they are fundamental to unlocking huge amounts of functionality for web synth and similar applications.

The most important function that AWPs expose is `process()`:

```js
/**
 * @param {Float32Array[][]} inputs
 * @param {Float32Array[][]} outputs
 * @param {{[key: string]: Float32Array}} params
 * @returns {boolean} True if the processor should continue processing, false if it should stop.
 */
process(inputs, outputs, params) {
  // ...
  return true
}
```

You get buffers containing input samples and parameter values, and you get output buffers that you write your generated or processed audio into.

Since the interface is so simple, it's possible to implement virtually anything in an AWP.  The parameters can optionally be configured to be audio rate as well, meaning even the most sophisticated modulation schemes can be supported as well.

### Bundler Limitations

In order to create an AWP, you need to register it with Web Audio by providing a URL to a .js file which defines it.  This URL needs to be available at runtime which makes it difficult to write AWPs in TypeScript or use them with a bundler, as bundlers often rename files to inject content hashes or combine multiple source files together.

<div class="note padded">
I'm sure that there is some way of doing it, but for web synth I opt to just write all my AWPs in plain JS and save them as static files, bypassing the bundler entirely.
</div>

Another option is to skip fetching a script altogether and load the worker from a data URL like this:

```ts
const src = `
class LfoAWP extends AudioWorkletProcessor {
 //...
}

registerProcessor('lfo-awp', LfoAWP);
`

const blob = new Blob([src], { type: "application/javascript" });
ctx.addModule(URL.createObjectURL(blob));
```

### WebAssembly

Even though modern JavaScript engines have become incredibly fast, JavaScript and other garbage collected languages aren't the best fit for real-time audio processing use cases.

<div class="good padded">
Luckily, WebAssembly is fully supported on <code>AudioWorkletProcessor</code>s and almost all of web synth's audio code is written in Rust compiled to Wasm.
</div>

Although Wasm does work very well with AWPs, there are a few hoops you have to jump through to get it up and running.  Like many things in modern web dev, there are a lot of moving parts and they're usually both asynchronous and fallible.

<div class="note padded">
After much trial and error, I've developed a pretty solid process for managing it all.
</div>

### Wasm-Powered AWP Initialization Scheme

For my AWPs, I have them start off inactive when they're first created.  Since the Wasm code that implements their functionality isn't available right away, I have them default to generating silence (in the case of synthesizers or audio sources) or passing through inputs as-is (for the case of effects and processing nodes).

The Wasm itself then needs to be loaded.  Since it's impossible to make network requests from the audio thread, it must be fetched on the UI thread and then posted over to the AWP using its [`MessagePort`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/port).

The AWP then asynchronously compiles + instantiates the Wasm and posts a message back to the UI thread once it's finished.  The UI then sends a message containing a state snapshot to the AWP, at which point the AWP becomes fully initialized and starts generating/processing audio.

By waiting until this point to send the initial state, any changes that the user made to the module's UI while it was loading will be reflected.  This helps avoid issues where the AWP gets out of sync with the rest of the application.

I created this sequence diagram to show a rough overview of the whole process:

<div style="display: flex; flex-direction: row; justify-content: center">
  <img src="https://i.ameo.link/d1z.svg" alt="A sequence diagram showing the process of initializing an audio worklet processor that runs WebAssembly code.  It has three participants: Internet, UI Thread, and AWP.  It has events for things like fetching Wasm, sending messages back and forth between the AWP and the UI Thread, and handling user input." />
</div>

I don't know how clear or helpful that all was, but I hope it makes some sense.

If you're interested in more details, I'd recommend checking out the source code for [`LFOAWP.js`](https://github.com/Ameobea/web-synth/blob/main/public/LFOAWP.js).  It's a relatively simple module without too much special stuff going on, but it implements all of the pieces described above.  I often use it as a template to build off of when creating new AWP-based modules.

## Live Visualizations

One last thing I wanted to touch on is how I handle live visualizations.  There are often cases where I want to get some data synced live from the audio thread to the UI thread.  Some examples are the detected volume of different channels of the mixer, phases of envelope generators, and applied attenuation for the multiband compressor:

![A screenshot of the UI for the multiband compressor module from web synth showing the live levels visualization for each band which is powered by `SharedArrayBuffer`.  There are controls for configuring each band with sliders for values like gain, attack_ms, up_ratio, etc.  There are multicolored bars stacked beneath each band which represent the detect input volume, target output volume, and applied gain in dB.](./images/modular-audio-nodes/compressor-levels-viz.png)

<div class="note padded">
For latency-sensitive cases like this, sending data via that AWP's message port isn't the best solution.
</div>

For one, it's not very efficient since each message requires creating a garbage-collected JS object and copying it over to a different thread.  It's also asynchronous; depending on scheduling or load, messages may get queued or delayed.

<div class="note padded">
A much better option is to make use of <code>SharedArrayBuffer</code> to directly share a chunk of memory between the threads.
</div>

They require a bit of [setup](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements) in order to be used.  You have to set some headers on your webserver which limit the origins from which you can load scripts and fetch data.  This is done to prevent against timing attacks like those from Spectre and Meltdown which could be used to leak private data from your computer purely through JavaScript.

Once that's done, a `SharedArrayBuffer` can be created on the AWP side and shared with the UI thread by sending it over via the message port.  Then, all values written to the SAB on the audio thread will be immediately visible on the UI thread.  A visualization can read the current value out every frame which will be the most recent value processed by the AWP.

I go into much more detail about this and some more complicated use cases involving SABs in my [older post](https://cprimozic.net/blog/building-a-signal-analyzer-with-modern-web-tech/) as well.

## Conclusion

I've been meaning to write something like this for a while.  Since it's a pretty niche area, there aren't many sources available with information on how to build a complex, large-scale Web Audio application, and I've figured out almost all of this through trial and error + iterative refinement.

----

I'm beginning to see some light at the end of the tunnel with regard to "finishing" Web Synth (maybe it will even get a real name!) and I'm considering the idea of writing a full blog post series that goes into more detail about individual components of the app and some of the more interesting pieces like timekeeping.

If that's something that would interest you, you can subscribe to my blog using the RSS link at the top of the page or follow me on the platform of your choice (I announce new posts on all of them):

 - Bluesky [@ameo.dev](https://bsky.app/profile/ameo.dev)
 - Twitter [@ameobea10](https://twitter.com/ameobea10)
 - Mastodon [@ameo@mastodon.ameo.dev](https://mastodon.ameo.dev/@ameo)

Thanks for reading :)
