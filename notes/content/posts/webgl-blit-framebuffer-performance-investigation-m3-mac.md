+++
title = "WebGL `blitFramebuffer` Performance Issues on M3 Mac"
date = "2026-04-24T14:44:30-05:00"
+++

## background

I've recently been working on some procedural background systems for a [browser-based game](https://github.com/ameobea/sketches-3d) I've been working on.

The idea was to create a sort of Shadertoy-style 100% per-fragment-procedural background. The background is what displays when there's no other actual scene object/mesh at a given pixel on the screen. So, in order to work efficiently, this pass reads from the scene depth buffer and skips all of its relatively expensive procedural logic in the case that the background won't be visible anyway.

## investigation

When I was testing out the procedural background system in a live scene with other effects and postprocessing, I was noticing that there were some pretty significant performance dips. It wasn't unplayable or anything, but my FPS dropped from a stable 120 to ~80-90 and felt somewhat jittery/hitchy as well.

My first thought was that the procedural shader stuff in the background was too heavy. I started trimming different pieces and optimizing the shader code as much as I could, but nothing had any effect.

At some point, I added an early return at the beginning of all the procedural stuff, essentially making the shader just return pure black. Even after doing that, the FPS didn't move at all!

This made me realize that the perf regression wasn't related to the fancy background shader at all but instead was something about the plumbing and the way the procedural background fit into the rendering pipeline and interacted with other passes.

## framebuffer blit performance issues

<div class="note">
After some trial and error, I discovered that the framebuffer blits I was doing to copy scene depth in and copy the procedural background output out were responsible for the vast majority of the perf regression.
</div>

This was surprising to me. I was previously under the impression that framebuffer blits were relative cheap since they were specialized and heavily-optimized hardware-level routines. This finding challenged that assumption.

To be fair, I was doing a pretty high amount of blits, definitely more than necessary:

- 1 to copy the scene depth in (I've dealt with a lot of issues with recursive depth texture bindings in the past, so copying it to a fresh buffer was a conservative safety measure)
- 2 to copy the output of the procedural background shader back to main scene color output buffers (my rendering pipeline uses two color buffers to differentiate normal diffuse color and special bloomed emissive colors)
- 1 to sync the depth out to the emissive render target

One interesting thing about these blits is that they didn't seem to actually cause any measurable load that I could track in the devtools performance tab, even in the GPU category. It's definitely possible that the GPU profiling just wasn't able to accurately track that.

However, another possibility is that the blits were especially expensive due to the hardware of the computer I was testing on (M3 Mac). The M3 GPU uses tile-based deferred rendering (TBDR) which has some different performance characteristics then other platforms like discrete GPUs on desktops.

It's possible that the framebuffer blits were acting as synchronization points for the pipeline, reducing hardware utilization or causing frame pacing issues. I'm not an expert at all on low-level hardware stuff like this, so take that assessment with a grain of salt.

## avoiding the blits

The main trick I used to remove the need for the two color blits was to do some hacky manipulation of the Three.JS render targets to just bind the existing output buffers directly as the color attachments of the background pass's MRT rather than copying into them after the fact.

For the depth-out blit, I used a slightly different technique: rather than copying depth into the emissive render target each frame, I aliased the scene depth texture directly as the emissive RT's depth attachment so they share the same underlying texture.

Together these got rid of three of the four blits; the one that remains is the initial copy of scene depth into a standalone buffer, which needs to stay in order to prevent the recursive depth texture binding problem on the main effect composer.

This all required doing some raw WebGL operations and bypassing Three.JS for a few things. It needed to be done carefully to avoid putting the WebGL pipeline or Three.JS into a bad state.

I also made some additional small optimizations like only calling `framebufferTexture2D` to re-bind textures to the framebuffer in the case that the textures actually changed.

<div class="good">
As a result of all these changes, I was able to almost entirely mitigate the performance dip caused by this procedural background pass and get back to a stable 120FPS even with some decently expensive shader code in the background itself.
</div>

## conclusion + takeaways

- WebGL framebuffer blits are apparently not as cheap as I thought they were - especially on certain architectures like Mac and mobile.
- There are opportunities to get extra performance by doing things manually in a way that top-level Three.JS APIs can't
- Old and often-repeated advice, but you have to actually profile rather than making assumptions about what's causing something to be slow
