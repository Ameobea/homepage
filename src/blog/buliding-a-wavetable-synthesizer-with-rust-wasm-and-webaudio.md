---
title: 'Building a Wavetable Synthesizer with Rust, WebAssembly, and WebAudio'
date: '2019-12-04'
---

TODO: Insert cool picture of wavetable synth visualization or something similar

Wavetable Synthesis is a method for synthesizing audio by interpolating between different pre-sampled waveforms stored in a table. It's a very neat way to generate sounds that change over time, allowing the different waveforms to morph into each other slowly in order to create rich and complicated textures.

I've been experimenting with synthesizing audio in the web browser via my [web synthesizer project](https://github.com/ameobea/web-synth), and figured that wavetable synthesis would be a cool addition to the platform. It seemed like a simple enough thing to implement from scratch and an awesome opportunity to put Rust and WebAssembly to work in a useful way!

## Background on Wavetables and Computer Audio Programming

The construction of the wavetable itself is relatively straightforward: All that is needed is a bunch of sampled waveforms in memory. It's possible to have any number of these waveforms in the table, and the number of samples in each waveform is arbitrary as well.

As a bit of background, in computer audio sound is represented as a series of floating point numbers from -1 to 1. These represent the physical position of the speakers as the electromagnets that control them are powered on and off. By varying this value over time, the speakers move and vibrate the air molecules, producing sound. The rate and amount by which these values change determines the kind of sound that is produced. It's kind of awesome how direct of a connection there is between the code and the physical world here - that's something that you don't see every day when working with modern software.

A waveform is nothing but a list of these floating point samples. Most waveforms produced by synthesizers are periodic, meaning that the same pattern of samples repeats infinitely over and over to produce a constant sound. In the case of this wavetable synth, we will loop back to the beginning of the waveform once we reach the end. This means that we have to have at minimum one period of the wave stored in the table, otherwise we won't have enough information to fully re-construct the sound.

Anyway, a wavetable just consists of a 2D array of samples. As we move through the table, we interpolate between the different waveforms within it, meaning just that we mix their samples together. Take for example the simplest case: a table with just two waveforms. Let's assume that the "range" of this wavetable goes from 0 to 1; any value within this range can be selected to sample the wavetable in a slightly different way.

If waveform A is at the beginning of the wavetable at position 0 and waveform B is at the end of the wavetable at position 1, then we would sample both waveforms at the same sample index and then mix those two samples together according to the position that we're at in the table. In this way, we can sample the table using a 2D coordinate of `(sample index, mix factor)`. In the visualization below, the red line represents the sample index, and the blue log represents the mix factor.

![](./images/wavetable/wavetable_1.svg)

Each time we take a sample, we increase our sample index by some amount in order to move through the wave. The amount that we move is equal to the ratio between the frequency of the waveforms in the wavetable and the desired output frequency of the wavetable. By increasing the number of samples that we advanced through the wavetable for each sample output, the pitch of the output is increased. The same goes in reverse. In order to support non-integer ratios, we interpolate between the samples along the x axis in the same way that we interpolate between waveforms on the y axis.

### Adding More Dimensions

A 1D waveform (well, two if you count the waveforms themselves as have a dimension due to the fact that they're made up of many individual samples) is cool as it is - you can get a lot of neat effects out of just moving around the different waveforms there. However, what's stopping us from adding more layers of interoplation with _other_ wave tables, mixing the interpolated result of the first dimension with the output of the second? Nothing, of course; computers are really really good at indexing into arrays of memory and mixing together floating point numbers.

In order to do that, we'll need to add two additional variables for each dimension: one to control the mix factor of the second dimension, and one to control the mix between that dimension and the previous dimension. So the total set of all inputs that we have when sampling our n-dimensional wavetable now look something like this:

- `sample_index`: The current horizontal position within the wavetable marking the sample index of the waveforms that we're sampling
- `output_frequency`: The desired output frequency. `output_frequency / wavetable_frequency = sample indices moved per sample`
- `dimension_0_mix`: The mix factor of the first dimension; vertical position within the wavetable for that dimension

And additionally, for each dimension after the first one:

- `dimension_n_mix`: The mix factor for the nth dimension; vertical position within the wavetable for that dimension
- `dimension_n_interdimensional_mix`: The mix factor used to interpolate between the output of the previous dimension and this one

In a way, this can be thought of as constructing a chain of "virtual" wavetables, with the output of the previous wavetable serving as the input waveform for the _interdimensional wavetable_. Each wavetable is sampled independently and then mixed with the output of the previous dimension to yield its output, which can then be mixed again etc. It will probably be a good idea to use smaller mix factors for the higher dimensions in order to preserve the effects that the lower dimensions had on the sound; otherwise it's possible for a higher dimension with a high mix factor to almost entirely take over the generated sound.

The alternative to this sort of chaining strategy would be to sample have a single mix factor for each dimension that all added up to 1.0 and then do a weighted average of the outputs from each of them according to their mix factor. The issue with this that I imagine, however, is that there are many more opportunities for signals to cancel themselves out of degrade to noise in that kind of environment. When we mix only two dimensions together at a time, the interactions are much more tightly controlled, and we get an aditional parameter with which to control the mix between dimensions.

## Rust to Raw WebAssembly without `wasm-bindgen`

## Constructing the Waveforms

For testing and demo purposes, I figured it would be a good idea to implement a 2-dimensional wavetable populated with the 4 basic waveforms: sine, triangle, sawtooth, and square. Generating them from scratch is straightforward enough, and they can be modified to any desired frequency.

Sine waves are just the sine function. The sine function naturally has a period of 2π, so we can just multiply x by (2π / desired_frequency) to scale it to our desired frequency:

TODO?

## Populating the Wavetable

## Sampling the Wavetable

### Debugging

## Result
