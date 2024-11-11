+++
title = "Fixing Artifacts Caused by Negative Color Sampling in WebGL"
date = "2024-11-10T16:22:35-08:00"
+++

## The Problem

I was working on a screen-space reflection shader.  This involves reading pixels out of the main scene's framebuffer/texture to be reflected.

I was seeing strange grainy-looking artifacts showing up in my reflections that I couldn't trace to anything in my shader code.  Here's what they looked like:

![A screenshot of a scene rendered with Three.JS using a screen-space reflections shader.  It shows a turquoise rectangular prism floating above a green rectangular platform with a reflection of the prism visible on the platform below.  The reflection has many grainy spots across it that looks like static.](https://i.ameo.link/cmg.png)

One thing I noticed was that the artifacts seemed tied to specific positions in the texture being read, meaning that the artifacts were tied to individual texels in the texture being read from.

Another interesting thing I noticed was that not all of the reflections had these artifacts; it depended on their color.

## The Cause

In my shader, I was returning sentinel values of `-1` in my reflection-finding function to indicate that there was nothing to reflect.  I then had a check in the main function like this to just use the existing fragment color in that case:

```glsl
vec4 raymarchReflections(...) {
  // ...

  if (!hasReflection) {
    return vec4(-1.);
  }

  // ...
}

void main() {
  // ...

  vec4 reflectedColor = raymarchReflections(...);

  // if no reflections found, pass through existing color
  if (reflectedColor.r < 0.) {
    gl_FragColor = diffuse;
    return;
  }

  // ...
}
```

After a good deal of debugging, I discovered that changing the check to this made the artifacts go away completely:

```glsl
if (reflectedColor.r == -1.) {
```

**As far as I can tell, there is just inherent imprecision when reading values from certain textures in WebGL.**

When reading some parts of the image with small values for some channel (red in my case), the sampled value is sometimes slightly negative.  This also explains why the artifacts only showed up in some of the reflections.  The blue one in the screenshot above had a color of `#09f0f9` which has a small but non-zero red channel.  Other reflections with larger red channel values didn't suffer from the imprecision issue.

For my case, I was using WebGL textures with a type of `HALF_FLOAT` and an internal format of `RGBA16F`.  It's possible that this is the reason for the imprecision and that this issue might not happen if storing textures in some other format like unsigned integer.  It might also be a quirk of my particular hardware, drivers, WebGL params, or one of the other hundreds of variables in play.

Anyway, the main thing I learned is that sampling values from textures isn't guaranteed to be exact and to take more care when using special-case values like these in shaders.
