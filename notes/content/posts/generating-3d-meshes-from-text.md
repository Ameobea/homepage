+++
title = "Generating 3D Meshes From Text"
date = "2025-11-27T23:41:35-06:00"
+++

![A screenshot of a 3D mesh which shows the text "Text to Mesh".  It is split with a diagonal line through the middle, and the right side is slightly thicker.  It is textured with a tan concrete/stone like texture and rendered with shadows and lighting.](https://i.ameo.link/de8.png)

I recently had a desire to convert text to 3D meshes that I could render and manipulate as part of my [Geotoy](https://3d.ameo.design/geotoy) project and Geoscript language. I did some research into tools and libraries that could solve different pieces of this, and I put together a pipeline that implements the whole thing - yielding nice, 2-manifold 3D meshes with arbitrary fonts, text styles, and more.

This post gives an overview of the whole setup and aims to give anyone else looking to implement something similar everything they need to get it working themselves.

## `svg-text-to-path`

The first part of the setup uses a JavaScript library called [`svg-text-to-path`](https://github.com/paulzi/svg-text-to-path). It handles taking arbitrary input text and font params and generating a SVG which contains paths that match the text as closely as possible.

Internally, this library handles both fetching + loading the user-specified font as well as performing the text->path conversion itself. It supports different backends for each of these steps.

For my use case, I made use of the Google Fonts provider. It was easy to set up and only requires a Google Fonts API key, which can be generated for free. This allows me to use almost any font on Google Fonts to create my meshes. Some failed to load, but only a few and they seemed to be more obscure ones, and I didn't bother to dig into why.

For the text->path conversion, `svg-text-to-path` defaults to using the [fontkit](https://github.com/foliojs/fontkit) backend. Fontkit is another pure JavaScript library that implements a font engine. I didn't look into it too deeply, but it seems feature rich and has support for many advanced font features.

For my use case, my app runs in the browser. I could have used `svg-text-to-path` directly within it to generate these paths. However, this text->mesh feature isn't core to my use case and I didn't want to bloat the app with it. I also wanted to make it as easy as possible for users to set up, and wanted to be able to use my Google Fonts API key in a secure way.

So, I opted to create a tiny little backend service to take input text + params and return the generated path as a string. It's a very minimal [Bun](https://bun.com) webserver using Bun's built-in `Bun.serve`. It exposes a single HTTP/JSON endpoint.

`svg-text-to-path` also includes a minimal built-in webserver, but I opted to create my own so that I could set up some custom caching and post-process the generated SVG to just extract the path. I opted to use an LLM to scaffold out most of this app and it worked pretty well. I feel like this kind of low-stakes one-off/standalone app is an ideal use case for them.

Here's the source code if you're interested, but I promise it's nothing special: <https://github.com/Ameobea/sketches-3d/tree/main/geoscript_backend/text-to-path>

Anyway, the output of this is an SVG path which encodes a sequence of draw commands used to generate the text like this:

```json
{
  "path": "M5.86 24L5.86 9.53L1.15 9.53L1.15 7.2L13 7.2L13 9.53L8.28 9.53L8.28 24ZM18.8 24.29Q17.09 24.29 15.85 23.47 ...."
}
```

## lyon

Now that I had the path generation working, I needed a way to turn it into triangles for the mesh. Luckily, the excellent [`lyon`](https://docs.rs/lyon/latest/lyon/) Rust libraries (which I've used several times in the past for various projects) solve this problem perfectly.

The [`lyon_extra`](https://docs.rs/lyon_extra/latest/lyon_extra/) crate includes an SVG path parser which handles parsing that path into the underlying draw commands.

Then, the [`lyon_tessellation`](https://docs.rs/lyon_tessellation/latest/lyon_tessellation/) crate takes those draw commands and converts them into triangles. It handles all the hard parts and edge cases with concave shapes, hollow inner areas, discretizing bezier curves, and everything else.

I implemented a tiny WebAssembly wrapper that takes the input path and returns vertex and index buffers: <https://github.com/Ameobea/sketches-3d/blob/main/src/viz/wasm/path_tessellate/src/lib.rs>

There is a little bit of extra stuff for handling custom scaling, but other than that it's really just a very thin wrapper over `lyon` functionality.

One note here is that I had to change the default `FillTessellator` options to set the [`fill-rule`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/fill-rule) to non-zero, which I believe is the default for SVGs. This fixes the output for some fonts that contain self-intersecting paths, going from this:

![A screenshot of a mesh generated from some text containing the letters "agB".  There are some artifacts and gaps in the letters that appear to be in areas where the different parts of the strokes that form the letters intersect each other.](https://i.ameo.link/de6.png)

to this:

![A screenshot of a mesh generated from some text containing the letters "agB".  The letters appear well-formed with no artifacts or gaps missing in areas where the different parts of the strokes that form the letters intersect each other.](https://i.ameo.link/de7.png)

## extrusion

So at this point, I had two buffers containing vertices and indices defining a 2D mesh matching the path for the text. The only part that remains is extruding it into 3D. This is a pretty straight-forward and common operation to do on a triangle mesh.

To start, you first convert all the vertices from 2D to 3D by filling in the new axis with zeroes (so like (5, 10) -> (5, 0, 10)).

Then, you flip the winding order of all the triangles in your mesh. WebGL and almost all other rendering systems use counter-clockwise winding orders, and that defines which direction the triangle is visible from. To flip them, you can just swap the first and third index of each triangle in the index buffer like this:

```
1,2,3,5,7,9,1,4,2

to

3,2,1,9,7,5,2,4,1
```

Then, you create a duplicate of each of the vertices offset `n` units in the new axis (so like (5, 0, 10) -> (5, 2, 10)).

Then, join those new vertices with triangles but in the original (unflipped) winding order. That will make the top and the bottom face in opposite directions - the top facing up and the bottom facing down.

Finally, you generate triangle strips to join the border edges of the top and bottom faces. A border edge is any edge that is only part of exactly one face. Usually a graph representation like a half-edge data structure is used when working with meshes, which helps with this part.

The result should look something like this:

![A screenshot a mesh representing the 3D letter O, rendered with a magenta wireframe and viewed edge-on.  The triangle strips used to bridge the top and bottom face together are clearly visible.](https://i.ameo.link/de9.png)

Here's my source code if you're interested, but note that it's using my own internal mesh representation: <https://github.com/Ameobea/sketches-3d/blob/main/src/viz/wasm/geoscript/src/mesh_ops/extrude.rs>

If you did everything correctly and took care to keep track of the vertex indices carefully to avoid creating duplicate vertices at the same position, the resulting mesh should be well-formed and 2-manifold/watertight. This is a very important topological property and is a requirement for a variety of other mesh processing algorithms including CSG (constructive solid geometry).

The fact that the output meshes are manifold means that they can be combined with other meshes using boolean operations or sent through additional processing like smoothing. I'm not 100% positive that all paths generated from all glyphs using all fonts will end up producing manifold outputs, but everything I tested did.

## conclusion

That's it! After all of this, the output is a set of vertices and indices that define a 3D mesh representing the input text.

I integrated this functionality into my Geoscript language as a builtin function:

![A screenshot of a 3D mesh containing the text "arbitrary text" rendered with Geoscript/Geotoy.  It has been sliced through the middle to demonstrate the fact that the mesh is 2-manifold.  The geoscript source code used to produce it is included at the bottom.  It's using the "Story Script" font from Google Fonts.](https://i.ameo.link/de4.png)

There are few steps to manage, but the powerful libraries under the hood (`svg-text-to-path`, `fontkit`, and `lyon`) handle all the complex stuff and heavy lifting.

Even though some of the critical libraries are in JavaScript and the fact that the generation happens on a remote webserver, I've found that for the (relatively short) text I convert it works quite fast - fast enough to work on-demand without waiting.

I've also not yet found any fonts that produce broken output or buggy meshes. It even works for complicated non-English scripts:

![A screenshot of a green mesh representing the Japanese character 芽 rendered using the "Yuji Mai" font](https://i.ameo.link/dea.png)

It was a fun little side-quest and I'm very happy with the results overall.
