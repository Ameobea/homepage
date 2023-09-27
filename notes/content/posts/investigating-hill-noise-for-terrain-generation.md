+++
title = "Investigating Hill Noise for Terrain Generation"
date = "2023-09-26T22:21:51-07:00"
+++

I've been working on some procedural terrain generation for my 3D work in Three.JS lately.  I wanted to try out a fresh noise function for generating terrain; everyone has used Perlin noise or some variant of it for decades.

I came across [a blog post](https://blog.bruce-hill.com/hill-noise) by Bruce Hill describing a noise function he designed himself - called Hill Noise.  It works by combining a bunch of sine waves together with different offsets and rotations.  If you add enough of them together, the results can look pretty organic and random.

The code is very short to implement this, so I ported it to Rust with minimal effort.  I then tested it out generating some terrain.  Here's one of the results:

![Screenshot of some floating test terrain generated using Hill noise.  It's textured with a reddish granite-looking material that has no apparent repetition or seams due to the use of a hex tiling shader](https://i.ameo.link/bi7.png)

It's alright.  This example uses 11 octaves of hill noise with wavelengths of `[220, 160, 120, 100, 75, 40, 20, 10, 5, 2, 1]`.  So that requires 11 sin operations per lookup; not the cheapest thing in the world, but it's not horrible.

Here's closer-up view with a wireframe to see a bit more detail:

![Screenshot of a zoomed-in version of the terrain generated using Hill noise, rendered as a multicolored wireframe.  There is a regular lumpyness that shows through on the surface of the terrain, with the lumps all about the same size, shape, spacing.](https://i.ameo.link/bia.png)

You can kinda see the higher-frequency sine waves showing through on the surface of the terrain.  It looks quite regular with all the lumps about the same size, shape, and spacing.  It's probably possible to alleviate this by fine-tuning/adding more wavelengths or manually setting amplitudes.

When I expand the terrain out further, here's how it looks:

![Screenshot of some floating test terrain generated using Hill noise, expanded out much further.  It's pretty clear where the sine waves at the lower frequencies repeat.](https://i.ameo.link/bi9.png)

The sine waves at the lower frequencies show through and the result looks pretty grid like and inorganic - at least it does to me.

One of the demos from Hill's blog (<https://blog.bruce-hill.com/media/hill-noise/hill_noise_2dshader.html>) uses 31 octaves of noise, but if you zoom out far enough you get the same issue.

You can probably find combinations of wavelengths to make it look at least decent for most settings, but it seems harder to work with than a full-fledged Perlin or Simplex noise.

## Conclusion

This is an incredibly simple noise function to implement, and it's not that expensive to compute.  It suffers from some visible tilings due to lower wavelengths of sine waves showing through.

It might be useful for some terrain generation uses, but probably not by itself.
