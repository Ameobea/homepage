+++
title = "Debugging WebGL GLSL Shader Behavior Differences Between M1 Mac and AMD GPU"
date = "2023-09-22T12:02:03-07:00"
+++

## The Problem

I've been working on a shader in GLSL for implementing volumetric fog via raytracing.  I did the majority of the work for it it on my M1 Macbook laptop while traveling, but I was eager to try it out on my powerful 7900 XTX when I got home to see how it performed.

To my surprise, the results looked extremely different!  The lighting was very low-detail on my desktop with the AMD GPU compared to how it looked on my Macbook.

Here's how it looked on the Mac:

![A screenshot of some volumetric fog rendered with my shader on my M1 Macbook laptop.  There is a green light reflecting off the surface of the fog.  The lighting is detailed and shows off the detailed 3D texture of the fog.](https://i.ameo.link/bhe.png)

And here's how it looked on my desktop:

![A screenshot of some volumetric fog rendered with my shader on my Desktop with an AMD GPU.  There is a green light reflecting off the surface of the fog.  The lighting looks inaccurate and low resolution, not matching the 3D texture of the fog well.](https://i.ameo.link/bhf.png)

I tried changing a few things to make the cases as identical as possible.  Macbooks have a High DPI screen with a pixel ratio of 2, and I thought maybe that was maybe causing the change in behavior.  However, when I disabled High DPI rendering, the results on the mac looked pretty much the same - so that wasn't it.

## The Cause

To generate the fog, I use a series of composed noise functions.  Each subsequent layer, or octave, is rendered at a finer scale and adds more detail to the fog.  The noise function I used ([`psrdnoise`](https://github.com/stegu/psrdnoise)) has built-in support for cheaply computing the gradient/derivative at each sampled point.  I make use of this functionality for my lighting computations.

Here's an excerpt from the code where I accumulate that gradient:

```c++
float sampleFogDensityLOD(vec3 worldPos, out vec3 gradient, const int lod) {
  float weight = LODWeights[lod];
  float scale = LODScales[lod];

  vec2 xzGradient;
  float noise = psrdnoise(worldPos.xz * scale, vec2(0.), 0., xzGradient);
  gradient += vec3(xzGradient.x, 0., xzGradient.y) * weight;
  return noise * weight;
}

float sampleFogDensity(vec3 worldPos, out vec3 gradient) {
  gradient = vec3(0.);
  float density = 0.;

  for (float lod = 0; lod < 4; lod += 1) {
    density += sampleFogDensityLOD(worldPos, gradient, lod);
  }

  return density;
}
```

It turns out that there's an issue in this code.

The `gradient` parameter is specified as `out vec3 gradient`, but the `sampleFogDensityLOD` function _reads and writes_ its value.  In GLSL, arguments marked `out` have their value uninitialized by default.

The GLSL compiler or something else in the graphics driver stack on Mac was being lenient and preserving the value.  The AMD compiler on the other hand was setting `gradient` to all zeroes in `sampleFogDensityLOD`, or something like that, and causing only the lowest level of detail's gradient to be sampled.

This is an instance of undefined behavior.  The initial value of an `out` argument is undefined, so the compiler is free to do whatever it wants when optimizing the code.

## The Solution

The fix was simple: just change `out gradient` to `inout gradient`.  That way, the value passed in is preserved and the gradient is accumulated properly.

This is something I'll certainly watch out for when writing shaders in GLSL in the future.
