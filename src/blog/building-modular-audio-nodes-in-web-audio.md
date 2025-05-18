---
title: 'Building Modular Audio Nodes in Web Audio'
date: '2025-05-18'
description: "An overview of the patterns I've developed for building modules for my browser-based DAW and audio synthesis tool.  It outlines solutions for keeping state synchronized between threads, handling async initialization and message passing, and integration with UIs and visualizations."
# TODO
imageWidth: 0
imageHeight: 0
imageUrl: 'TODO'
imageAlt: 'TODO'
---

For the past several years, I've been working on and off on a browser-based DAW and audio synthesis tool which is still stuck with the placeholder name [web synth](https://synth.ameo.dev).

![A screenshot of web synth, running in the browser.  The graph editor module is active, which shows the connectivity between various nodes with names like "Synth Designer", "Mixer", and "Gain".  The Mixer node is selected and there's an audio mixer UI rendered on the right side of the screen with audio level visualizations rendered.  There are tabs along the top for switching between different modules, and they have names like "MIDI Keyboard", "MIDI Editor", "arp", and more.](./images/modular-audio-nodes/web-synth.png)

When the project first started off, it was a wrapper around native [web audio nodes](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode) with a MIDI editor.  As I continued to work on it, the platform gained more and more custom nodes and modules to add functionality beyond that which was pre-built in web audio.

I've built dozens of these nodes at this point.  There's a pretty wide variety:

 * Effects or audio processing nodes like distortion, delay/flanger/reverb, compressors, vocoders, etc.
 * Audio generation nodes like a granular synthesizer, wavetable synth, and sample choppers and loopers
 * Visualizations and analysis nodes like a signal analyzer consisting of spectrogram + oscilloscope (on which I've previously written [a dedicated post](https://cprimozic.net/blog/building-a-signal-analyzer-with-modern-web-tech/))
 * Misc. utility nodes like envelope generators, randomness/noise generators, math nodes, mixers, and stuff like that.

<div class="note padded">
Over time, I've developed some useful patterns for building these modules and supporting pieces for them like UIs and visualizations.
</div>

By having a consistent architecture to build on for these modules, I'm able to build them much more quickly and free up mental resources for the modules' features themselves rather than focusing on technical implementation details.  This also makes it much easier to make fixes or changes to modules, which is helpful when working with code I last touched 5+ years ago.

## High-Level Architecture

All modules in my application

## `AudioWorkletProcessor`

TODO

## UI + Visualization

TODO
