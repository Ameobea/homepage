+++
title = "Handling Gamma Correction for Three.JS pmndrs `postprocessing` Effects"
date = "2024-01-22T11:31:08-08:00"
+++

I recently received a [bug report](https://github.com/Ameobea/three-good-godrays/issues/8) on a library I built - [`three-good-godrays`](https://github.com/Ameobea/three-good-godrays) - which implements screen-space raymarched godrays for Three.JS as a pass for the [pmndrs `postprocessing` library](https://github.com/pmndrs/postprocessing). One of the problems pointed out was that colors seemed washed out/desaturated when my pass was used, even when the pass wasn't rendering any godrays.

Here's how things look by default without the effect (and are supposed to look with it on):

![Screenshot of a scene rendered with Three.JS.  There's a red plane with a red cube floating above it, casting a shadow on the plane.  The red color is quite bright and cherry/tomato colored.](https://i.ameo.link/btp.png)

But here's how they looked with the godrays pass enabled:

![Screenshot of a scene rendered with Three.JS with the buggy godrays pass enabled.  The red plane and red cube look significantly darker and duller than they should.](https://ameo.link/u/btl.png)

The bug report is right - there's definitely something wrong.

## The Cause

The reason this is happening is due to differences in color space handling. According to the docs on the pmndrs `postprocessing` library, the internal buffers used by postprocessing passes are expected to store data in sRGB format ([relevant docs](https://github.com/pmndrs/postprocessing?tab=readme-ov-file#output-color-space)). To handle this, popular effects such as `n8ao` perform linear -> sRGB conversion by default: <https://github.com/N8python/n8ao?tab=readme-ov-file#usage>

To implement this, `n8ao` calls `LinearTosRGB()` on the pixel data output if `gammaCorrect` is enabled (which is the default).

## The Fix

To fix `three-good-godrays`, I simply added the exact same solution that `n8ao` used. I added the same `gammaCorrection` flag to the pass params, set it enabled by default, and added the same call to `LinearTosRGB()` [to the shader](https://github.com/Ameobea/three-good-godrays/blob/main/src/compositor.frag#L61-L63).

However, after adding this change, I noticed that my demos were experiencing some severe artifacts:

![Screenshot of artifacts caused by double encoding in a Three.Js pmndrs postprocessing pipeline.  There is a grainy pattern of colorful pixels appearing over an otherwise blank black background.](https://i.ameo.link/bto.png)

After digging into this, I determined that the artifacts went away if I disabled the `SMAAEffect` and its `EffectPass` that I had added to the postprocessing pipeline after the `GodraysPass`.

It turns out that output encoding is performed by default by `EffectPass` in some circumstances. This was causing my colors to get double-converted to sRGB which produced those artifacts.

To work around that, I ... just set `gammaCorrection: false` in the godrays pass params. This had the result of making things look the same way they did before for my demos. Another method of achieving this is to set `outputEncoding = false` on the `SMAAEffect`'s `EffectPass` which disables the double-encoding.

One thing to note is that I have also set the `frameBufferType` to `HalfFloatType` on the framebuffers used by the `postprocessing` `EffectComposer`. The reason I do this is to avoid color banding that results from the loss of precision by the default 8-bit color format.

```ts
new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
```

## Other Notes

The color space/encoding handling in the Three.JS ecosystem is very complex and confusing to me at the moment. Three.JS recently made some internal changes to [Color Management](https://threejs.org/docs/#manual/en/introduction/Color-management) which might be interfering/conflicting with pmndrs `postprocessing` in some ways.

If you're still running into color issues in your Three.JS projects, some other things you can try are:

- Toggling `THREE.ColorManagement.enabled = true;`. I set this to `true` for my demos, and I believe this is the "right way" to do things in modern Three.JS.
- Changing the `outputColorSpace` of your `WebGLRenderer`. This is set to `THREE.SRGBColorSpace` by default, and I think it's suggested to not change that.

I'm honestly not really sure about the details of these things myself. For my projects, I generally end up trying various combinations of these settings until things look right :p

In any case, I hope this helps give you some info on possible solutions if you're running into these problems yourself.
