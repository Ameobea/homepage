+++
title = "Exporting Minecraft Objects to Three.JS"
date = "2023-10-25T01:47:51-07:00"
draft = true
+++

Recently, I've been working on some [interactive sketches/games](https://github.com/ameobea/sketches-3d) in Three.JS. For one of the levels I was building, I had the idea of importing something I built from one of my old MineCraft survival worlds in to use as part of it.

I figured that there was a pretty good chance of some software existing to export MineCraft levels to some 3D model format for 3D rendering or other purposes, and that indeed is the case. There are multiple options out there, but the one I chose to go with was [`jmc2obj`](https://github.com/jmc2obj/j-mc-2-obj/wiki/Getting-started).

## Exporting with `jmc2obj`

`jmc2obj` is a fairly minimalistic application which lets you export parts of a MineCraft world into .obj format - a very common and simple 3D object format. I chose it because it's very simple to install (just a standalone .jar file you can download), it's fully open source, and it has some pretty good docs and usage guides.

Its UI is pretty straightforward to use. You load your world, select the dimension to export, select the region of the world you want to export, set some export settings, and get a .obj file as output.

There are a good deal of options, but most are fine at their defaults and there are some [thorough docs](https://github.com/jmc2obj/j-mc-2-obj/wiki/Options) on them as well. Here are a few you might want to take a look at though:

- "Select blocks to export" if you want to filter out some blocks from the selection. I used this to get rid of torches, ladders, and some other stuff that I didn't want included in the generated model.
- "Export Textures" if you want the generated model to be textured with MineCraft textures. It will use the vanilla resource pack textures by default, but you can also load in your own resource pack.
  - Apparently there are also some special PBR resource packs that have things like normal maps built in. `jmc2obj` has support for these, and if you use one the resulting model's materials will be full-fledged PBR materials themselves.

After you run the export, you should have a .obj file and optionally some associated .mtl files. These contain the geometry and textures (if applicable) for your exported model respectively.

## Loading the .obj Model in Three.JS

## Loading + Modifying the Model in Blender

### Re-Exporting to glTF
