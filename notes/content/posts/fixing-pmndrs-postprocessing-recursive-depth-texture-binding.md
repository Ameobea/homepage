+++
title = "Fixing pmndrs Postprocessing Recursive Depth Texture Binding"
date = "2023-08-29T22:55:42-07:00"
+++

I've been working on building [3D scenes and environments](https://github.com/ameobea/sketches-3d) in the browser using Three.JS.  As part of those, I make pretty heavy use of the [pmndrs `postprocessing` library](https://github.com/pmndrs/postprocessing) for post-processing and effects.

I've also implemented a custom godrays effect that works with `postprocesing` called [`three-good-godrays`](https://github.com/ameobea/three-good-godrays).  It creates a custom pass that is added to the postprocessing `EffectComposer` which renders volumetric screen-space godrays by reading the depth buffer and shadow map for a light.

## The Problem

For one of my scenes, the postprocessing chain had gotten pretty long with several different effects in use.  At some point, I started seeing errors like this in the JS console:

```txt
[.WebGL-0x16c00334d00]GL ERROR :GL_INVALID_OPERATION : glDrawArrays: Source and destination textures of the draw are the same.
```

In addition, my godrays effect stopped working.  I used the [Spector.JS](https://spector.babylonjs.com/) browser extension to debug the WebGL rendering sequence for one of my frames and I saw that the shaders were getting launched, but nothing seemed to be getting rendered into the destination buffers.

## The Cause

As I mentioned previously, the shaders used internally by `three-good-godrays` and some of the other effects in my pipeline needed access to scene depth information.  The `Pass`es added to the `EffectComposer` have a [`needsDepthTexture`](https://github.com/pmndrs/postprocessing/blob/a65812998ebb76de962c7e2ef510ed3baf090bb2/src/passes/Pass.js#L150) attribute that they can set to indicate that they need access to the depth buffer.  If set, the `EffectComposer` will call their `setDepthTexture()` method and provide them a texture containing it.

Internally, `EffectComposer` has two buffers that it swaps back and forth between when rendering the passes.  I looked at the code and the logic looks roughly like this:

```py
input_buffer, output_buffer = build_buffers()

if any_pass_needs_depth_texture:
  input_buffer.bind_depth_texture(build_depth_texture())

for i, fx_pass in enumerate(passes):
  is_last = i == len(passes) - 1
  render_to_screen = is_last or pass.render_to_screen
  # Passing None indicates that the pass should render to the canvas framebuffer
  # which puts its output directly onto the screen
  fx_pass.render(input_buffer, None if is_last else output_buffer)

  # needs_swap defaults to true
  if pass.needs_swap and not render_to_screen:
    output_buffer, input_buffer = input_buffer, output_buffer
```

When the depth texture is first initialized, it gets set on the input buffer.  Since these buffers swap back and forth each frame, it's possible that the depth buffer will be attached to the output buffer while processing the effect.  If the pass makes use of the depth texture as input for some shader by passing it as a uniform or similar, it will cause the WebGL error I pasted before and cause the pass to fail to render.

This is a known bug/limitation of `postprocessing`.  There are multiple issues about this:

 * https://github.com/pmndrs/postprocessing/issues/225
 * https://github.com/pmndrs/postprocessing/issues/416

They plan to address it in a release of version 7, which is not yet out at the time of writing this.

## The Fix

Luckily, it's possible to work around this issue.  I had to update `three-good-godrays` to detect and handle case where the provided depth texture is the same as the one bound to the provided output buffer.

If it is the same, then I allocate an additional framebuffer the same size of the depth texture, run a `CopyPass` to copy the contents of the depth texture into it, and then bind that copied buffer as the input for the `sceneDepth` uniform of the shader instead.  This fixes the "Source and destination texture sof the draw are the same" error and allows the pass to render without issue.

I made that change in [this commit](https://github.com/Ameobea/three-good-godrays/commit/294cc263697e0e135270dd7a620d95ce6d547dc2).  I do hope that pmndrs `postprocessing` gets that v7 rework; it was very hard to figure out what was causing this and debugging it took several hours.
