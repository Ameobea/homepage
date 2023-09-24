+++
title = "Some Notes and Docs on the Rust Blackjack Procedural Geometry Tool"
date = "2023-09-24T15:26:03-07:00"
+++

I've been trying out a tool written in Rust called [Blackjack](https://github.com/setzer22/blackjack) for procedural, node-based 3D modelling.  It's a lot like Blender's geometry nodes.

There aren't a lot in terms of docs, and it looks like the project isn't being actively developed right now.  Nonetheless, I think it's an extremely cool project, and the code is very high quality.  So, I've been spending a bit of time getting familiar with it and trying it out.

**Note**: This was written in September 2023.  If development of this project ever picks back up, it's likely that much of this will go out of date fast.

## Selections

Some nodes like bevel, extrude, and others operate on individual edges or faces.  Here's "Edit Geometry" for example:

![Screenshot of the "Edit Geometry" node from the blackjack UI.  Shows several inputs, outputs, and parameters such as a red "mesh" input, translation, rotation, and scale params, and a dropdown selection for edit type.](https://i.ameo.link/bhq.png)

The way to specifying which edge/face to operate on seems to be entering their indices manually.

In the code, I found that it's possible to use some special syntax to do things like select all and select ranges of indices:

```txt
0, 1, 2 // Select elements 0, 1 and 2
* // Select all elements
0..1 // Select a range of elements
0..5, 7..10, 13, 17, 22 // Select multiple ranges, and some single faces
 // (empty string), selects nothing
```

Another issue I had at first was figuring out the indices of things.  I found a part of the UI under the "Mesh Visuals" button which has options to display text on the model itself to make that clear:

![Screenshot of the "Mesh Visuals" menu from the blackjack UI along with a slightly deformed cube rendered in the 3D viewport.  The "V" option of the "Text Overlay" section is selected, which has caused white labels to be displayed on each vertex.](https://i.ameo.link/bhr.png)

I looked a little bit to see if there was a way to programmatically define selections, like pick all edges that have an angle greater than some value, but I didn't find anything for that.

## Terrain

One thing I was eager to try out with this tool was terrain generation.  I saw in the code that there's some stuff there for perlin noise-based terrain generation, and I wanted to try that out.

However, as far as I can tell, that isn't currently hooked up/accessible from the blackjack UI.  The only thing that's there is a code box to enter some lua code that's evaluated for each point on the heightmap to generate it:

![Screenshot of blackjack UI showing a terrain node with some code entered to generate a heightmap, along with the rendered result in the 3D viewport.  The entered code is `function (x, y) return math.sin((x + y) / 10) end`](https://i.ameo.link/bhs.png)

This isn't very useful for much, unfortunately, and if I do end up using this I'll probably end up writing some code to either pass through the perlin noise-based terrain.

Also something to note: If you create a named function, it won't work; you have to use an anonymous lua function.  This might be obvious to people familiar with Lua, but it was not for me.

## Compiling to Wasm

Since Blackjack is written in Rust, it should be possible to compile it to Wasm.  There's one draft PR up on the repo with some changes aimed at facilitating that, but it's extremely stale at this point and will likely never be merged.

I spent some time yesterday working to get `blackjack_engine` - the crate which implements the actual graph and node operations - compiled to Wasm and running in the web browser.  After some significant effort, I was able to accomplish that.  It's able to load a .bjk file (the format produced when saving Blackjack graphs) and evaluate the graph.  This includes getting the whole lua engine (which is written in C or C++) compiled to Wasm as well.

Note that this is just the engine - not the UI and editor.  It should be possible to do that in the future, though, because as I understand it the UI library that Blackjack uses does have support for running in the browser.

I plan to write a separate post about this in the future.
