---
title: 'Implementing Depth Pre-Pass Optimization for Three.JS'
date: '2022-09-27'
---

<div class="note">

This is a follow-up post that improves upon <a href="https://cprimozic.net/blog/depth-based-fragment-culling-webgl/">one I wrote yesterday</a>.  The last post implemented this optimization in a manual way, but it turns out that it's possible to do it in a much simpler and more efficient manner using built-in WebGL/OpenGL features.

Thanks to /u/kibakufuda and /u/cesium-sandwich <a href="https://www.reddit.com/r/threejs/comments/xpecac/speeding%5C_up%5C_threejs%5C_with%5C_depthbased%5C_fragment/">in the reddit comments</a> for sharing that info!

</div>
<br/>

## The Problem

As I mentioned in my [previous post](https://cprimozic.net/blog/depth-based-fragment-culling-webgl/), I've been working with WebGL and Three.JS lately on a project.  My scene makes use of a [very clever algorithm](https://www.shadertoy.com/view/MdyfDV) in its fragment shader to implement seamless texture tiling without any visible grid patterns.  Here's how it looks compared to just tiling the texture normally:

<iframe src="https://homepage-external-mixins.ameo.design/depth_based_fragment_culling/tiling_compare.html" loading="lazy" style="width: 100%;aspect-ratio: 1856/1326;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>
<!-- <iframe src="http://localhost:5173/depth_based_fragment_culling/tiling_compare" loading="lazy" style="width: 100%;aspect-ratio: 1856/1326;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe> -->

The algorithm works great and looks really good, but it has one issue: it's very computationally expensive.  It performs a lot of math to transform coordinates, and it requires three texture lookups per fragment.

As my level got bigger and I added more meshes to it, I noticed that performance was continuing to go down even when just staring at walls.  As detailed in the last article, there are a lot of different methods that have been developed to reduce the work done when rendering a scene - mostly different kinds of culling which use various tricks to determine which things don't need to be drawn.

For my scene, the expensive part is the fragment shader.  It was getting run for much of the hidden geometry in the scene and then thrown away when covered up by a shallower fragment from a nearer object.  This phenomenon is called **overdraw**.

Three.JS makes an attempt to reduce this by sorting objects when rendering them so that closer ones are rendered first and the fragment shader can be skipped for those that are further away.  However, my scene featured a lot of large meshes like buildings and terrain that covered a lot of area on the screen.  This made that particular optimization less effective for my case.

## The Solution

To get my scene rendering efficiently, I added a **depth pre-pass**.  This works by rendering all meshes in the whole scene at the start of the frame using a very simple material.  It does this in order to pre-populate the depth buffer with the depth of the shallowest fragment for all pixels on the screen.  Since this pass uses a very inexpensive fragment shader, it completes very quickly and doesn't add much overhead to the rendering process.

Then, just before rendering the main scene, I set the depth function for the WebGL renderer from the default of `LEQUAL` to `EQUAL`.  This tells WebGL to discard all fragments for which the depth doesn't match the shallowest depth already recorded in the depth buffer.

The nice part is that this is extremely easy to set up for Three.JS in only a few lines of code.  I'm using the [`postprocessing`](https://github.com/pmndrs/postprocessing) library to manage a multi-stage rendering pipeline, and was able to set up depth pre-pass using it like this:

```ts
import { EffectComposer, RenderPass, Pass } from 'postprocessing';

class DepthPass extends RenderPass {
  constructor(scene: THREE.Scene, camera: THREE.Camera, overrideMaterial: THREE.Material) {
    super(scene, camera, overrideMaterial);
  }

  render(
    renderer: THREE.WebGLRenderer,
    inputBuffer: THREE.WebGLRenderTarget,
    outputBuffer: THREE.WebGLRenderTarget,
    deltaTime?: number | undefined,
    stencilTest?: boolean | undefined
  ): void {
    renderer.getContext().depthFunc(renderer.getContext().LEQUAL);
    super.render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest);
  }
}

class MainRenderPass extends RenderPass {
  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    super(scene, camera);
    // Avoid clearing the depth buffer before rendering as that would throw out all the depth data
    // computed in the pre-pass
    this.clear = false;
  }

  render(
      renderer: THREE.WebGLRenderer,
      inputBuffer: THREE.WebGLRenderTarget,
      outputBuffer: THREE.WebGLRenderTarget,
      deltaTime?: number | undefined,
      stencilTest?: boolean | undefined
    ) {
      const ctx = renderer.getContext();

      // Set the depth test function to EQUAL which uses the pre-computed data in the depth buffer to
      // automatically discard fragments that aren't visible to the camera
      ctx.depthFunc(ctx.EQUAL);
      super.render.apply(this, [renderer, inputBuffer, outputBuffer, deltaTime, stencilTest]);
      ctx.depthFunc(ctx.LEQUAL);
    }
}

// Auto-clearing the depth buffer must be disabled so that depth information from the pre-pass is preserved
viz.renderer.autoClear = false;
viz.renderer.autoClearDepth = false;

const composer = new EffectComposer(renderer);

const depthPass = new DepthPass(scene, camera, new THREE.MeshBasicMaterial());
// The depth pre pass must render to the same framebuffer as the main render pass so that the depth buffer is shared
depthPass.renderToScreen = true;
composer.addPass(depthPass);

const mainRenderPass = new MainRenderPass(scene, camera);
mainRenderPass.renderToScreen = true;
composer.addPass(mainRenderPass);
```

The effect composer has some confusing behavior involving which framebuffers it actually ends up rendering to.  The goal is to have the depth pre-pass and the main render pass draw to the same framebuffer so that the depth buffer is shared.  I've found that if the main render pass is the final render pass in the composer, then setting `renderToScreen = true` for both the depth pre-pass and the main render pass to be correct.  If you have some other post-processing passes like anti-aliasing or similar, I've found that setting `renderToScreen = false` for both the depth pre-pass and the main render pass to work instead.

I put together a [full example](https://github.com/Ameobea/sketches-3d/blob/main/src/viz/scenes/depthPrepassDemo.ts#L69-L89) of implementing this fully as well.

----

And that's all there is to it!  For my scene, this yielded something like a 30%+ performance increase, and my scene isn't even that large.  There is a little bit of added overhead from the depth pre-pass, but it's well worth it in my case since the fragment shader is so expensive.

My [previous post](https://cprimozic.net/blog/depth-based-fragment-culling-webgl/) implemented this same functionality, but it didn't make use of the automatic fragment discarding using the `EQUAL` depth test function.  Instead, it rendered the depth buffer to a texture, bound the texture to the fragment shader, and then added some code to the fragment shader to do a manual comparison against the depth in that texture.  If the depth of the current fragment was greater than the depth for that pixel from the depth texture, it would manually `discard` the fragment.

It worked alright and boosted performance, but this method works even better and saves another ~10-15% performance on top of that.
