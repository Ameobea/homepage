## Overview

Will serve to give an summary of what web synth is, why it exists, what it can do.

Will serve as an index/ToC for the other posts in the series.

I also want to include information about what the synth does well and what its weak points are

Strong points:

* very fast load times
* no installation needed
* cross platform/cross browser
* simple shareable compositions
* embeddable into other web apps via headless
* built with open web technologies and fully open source

Weak points:

* buggy and lots of rough edges
* unpolished and unintuitive UI in many places
* lacking features, some of which are important for music production
* no multithreaded audio rendering (although that's not a technical impossibility and could theoretically be added in the future)
  * we can do a whole lot with one thread well used, though
* hard-coded sample rate, frame size, and other stuff
* single channel
  * again, web audio has plenty of support for many channels and so does Faust/Soul/pretty much everything else.  It would just be a matter of implementing it, and it could probably be done in an incremental fashion.

## Synth Designer: Plumbing

I thought I'd split the work on the synth designer into two parts since it's the most substantial component of the platform.  I have to partition this stuff as cleanly as possible.

- high level structure (midi events into output signal)
- polyphony manager
  - Tacet voice culling and other optimizations
- AWP and Web Audio integration with channels and params
  - split of controls between params which are set via web audio/AWP params and those set via messages
- `SharedArrayBuffer` for communicating envelope generator phase to the UI for rendering the ADSR UI
- MIDI mailbox + event handling
  - dedicated article will be written about event scheduler, global beat counter, and audio thread midi event scheduling in general, so just include enough info to give context
  - add some brief notes about integration with Web MIDI (although that technically happens outside the synth designer, I think this is the best place to discuss it)
- `ParamSource`
- ADSRs + volume/filter envelopes
  - **ADSRs are a big topic and might even warrant their own post**
  - curve types
  - rendering into a LUT
  - phase data sync via SAB
  - log/linear modes


## Synth Designer: Sound Generation

- core FM impl
  - technically phase modulation
  - modulation matrix, feedback, modulation index
- Wavetable, including wavetable builder and import
- oversampling
- filter module
  - originally implemented using vanilla web audio filter nodes, sometimes chained in series and dynamically plugged/unplugged
  - this had some significant overhead since data had to be copied between all those nodes, each had to be computed separately, each filter chain had to be duplicated for each of the synth voices, params had to be wired up to each filter, coefficients couldn't be re-used between filter instances, etc.
  - another huge downside is that the FM synth needed to have a separate output channel for each voice, so that each voice's output could be connected to its filter chain.
  - eventually moved all the filters into the synth itself and re-implemented web audio's `BiquadFilterNode` using the web audio spec, as well as creating some other custom filter types.
- unison, phase randomization
- detune
- mention that I've built some effects, maybe list off some of them, but don't go into too much detail.  I'm writing a separate post dedicated to those.

## Graph + Module System

- Patch network and how it builds on top of Web Audio
- connectables and how dynamic connectables are handled
  - connectable types
    - special handling for MIDI nodes
  - wrapping audio nodes
  - `ForeignConnectable`
    - (initially was planning to mostly wrap web audio stuff, but it turns out that you have to build most useful things yourself)
- VCs and FCs
- Graph editor
- `OverridableAudioParam`
- Handling initialization/cleanup and dynamic connection/disconnection
- Rust engine for handling state
  - relic of the past and not a good design; only really creates more overhead and complication
- subgraphs
  - use for cleaning up large UIs and organizing patches
  - use for modularizing instruments or effects in order to make them cleanly re-useable

Should probably mention some of the missing pieces:

- no latency compensation
- some things keep running regardless of whether or not there is an input signal.  Might be necessary to dynamically connect/disconnect modules during playback to keep things efficient in the future.

## Dynamic Faust + Soul Compilation to Wasm

Faust was very appealing to me as a way to fill in missing functionality for web synth while it was still early on in development.  Turns out to be a consistently useful feature even now given the high performance of its generated Wasm and large variety of stuff that can be built with it.

Soul is a sort of alternative/competitor to Faust, filling a similar niche of creating high-performance effects, synths, and other components.  Also supports generating Wasm outputs natively in a markedly similar manner to Faust.

### Architecture

- Compiler server which receives Faust code as input and returns compiled Wasm blob
  - the Faust compiler generates some metadata in the Wasm blob itself. The wasm blob is cached in GCP to prevent it needing to be compiled every time (useful for presets). This is extracted by parsing the Wasm, extracting the data section, and parsing it as JSON. This is then stored in GCP.
  - the compiler provides an endpoint for dynamically generating the AWP.js code, into which the parsed module definition is inserted. This is used for dynamically generating the UIs and parameter descriptors. Much of the rest of the AWP file was copied/reverse engineered from the existing Faust code.
- Frontend initializes the worklet node, sends in the Wasm blob which is then instantiated, and builds the UI and creates + connects OAPs and other nodes to control the params.
- So all of the inputs defined in the Faust code get turned into parameters on the AWP. Since all those params are available as web audio params, they can be dynamically patched and controlled in the web synth graph.
  - the only limitation is that these params are all K-rate params, so certain types of modulation aren't quite feasible.  The AWP just retrieves the value of each of them each frame and sets them into the Wasm instance using the `setParamValue` API that Faust generates.

Faust compiler also supports being itself compiled to Wasm and running fully on the frontend.  I opted against this for two reasons:

- the compiled faust compiler is pretty large and is itself bigger than the whole web synth code bundle size (TODO VERIFY THIS)
- the backend uses `wasm-opt` to optimize the generated wasm bundle before sending it to the UI.  This can produce significant benefits in many situations. It might be possible to also compile `wasm-opt` to wasm and run it fully on the client side, but that would double the issue of the first point.

Soul compiler works in a very similar way.  Instead of parsing the Wasm blob and extracting a data segment, it actually initializes the instance and invokes `getDescriptionLength` and `getDescription` functions to retrieve the module metadata.

Frontend works almost identically, just with changes to handle the different metadata formats.

## UIs + Visualizations

A huge portion of building a DAW is UI work.  Every single component has a high degree of UI involvement.  UIs are often complex, highly dynamic, need to send/receive data/events to/from the audio thread.  I'd judge that I spent significantly more effort working on building UIs than any other individual part, far overshadowing DSP stuff and other audio processing code (although I did lean heavily on web audio which has many needed pieces pre-built).

I built many UIs out of just normal HTML/CSS and leaned heavily on `control-panel` to make generating them easier.  Certain specialized and important ones (MIDI editor and envelope generator especially) required fully custom impl with PIXI.js.

- pixi.js heavily used for interactive UIs and visualizations
  - MIDI editor
    - need to either devote significant space to describing this or split it out to its own article if I by some miracle still have motivation to write these by this point
  - ADSR/envelope generator
  - Multiband compressor
  - Mixer
  - Wavetable builder
- wanted to avoid the trend of other synth/DAW/effect UIs I've seen in the past that try to replicate analog UIs with knobs and fake LCD displays etc.
- control-panel + my custom `react-control-panel` and `svelte-control-panel` ports
  - makes creating the huge number of unique UIs required for the app tenable and covers a surprisingly large number of use cases
- litegraph
- using mix of React and Svelte to implement the other various UIs of the app
  - talk about the system used to switch the active VC with rendering each in a div, swapping hidden/shown states when changing
- d3
- control panel, the VC module.
  - quite proud of the idea for this one, and it works pretty well
- advanced multi-threaded visualizations
  - link to signal analyzer blog post

## Effects + Modules

I want to give a little rundown of the different effects and modules that I've built.  I will cover a lot of ground without going into implementation details or effect-specific plumbing.

- start out by demonstrating what a very basic effect (distortion) looks like in Rust.
- talk about all the delay-based effects and how simple and versatile they are
  - all just different variations of a delay line
  - flanger, chorus, comb filter, delay/echo itself
- brief listing of the other effects used in the synth designer
- multiband compressor
  - I blatantly tried to clone OTT
  - it sucks and I need to re-write it, but it honestly it sounds pretty good for a lot of cases already.
  - show off the cool UI but don't dig into the implementation
- vocoder
  - also sucks and needs to be re-written lol
- granular synth
  - pretty cool, works pretty well, nice UI
- filter designer
- safety limiter

TODO: go through the list of VCs and check to see which ones I've missed.

## Timekeeping

- talk about how web audio manages time
  - has a real-time counter in seconds which is available while rendering on the audio thread
    - TODO: figure out the implementation details of this thing.  see if it actually does compute based off the current frame ix when rendering ahead or not (if it doesn't we might have to change some stuff lol)
- global beat counter
  - keeps track of musical time in beats during playback.  gets stopped/started when playback is stopped/started. can be started at arbitrary points to support starting playback in the middle of a composition.
  - handles incrementing the current beat each frame according to the current tempo
  - tempo can be changed dynamically during playback; there's a dedicated CSN which is controlled by the UI that's read by the global beat counter each frame.  Could technically even be modulated by the audio graph.
- event scheduler
  - supports scheduling MIDI events as well as arbitrary function calls in both seconds and beats, including support for scheduling relative to the current beat
  - used extensively by stuff like the MIDI editor, looper, and sequencer to support playback
  - give overview of the impl of the event scheduler AWP including the Rust side
  - has support for canceling scheduled events when playback is stopped and stuff like that
  - was very involved to build and took a lot of planning and changes to the application
  - dynamic events are still supports for things like the MIDI keyboard
  - lots more nicely written info from the time I implemented it in the `audio-thread-midi-scheduling` docs article; definitely check that out.

## Other stuff that doesn't have a clear place

- MIDI mapping learning and MIDI keyboard in general
