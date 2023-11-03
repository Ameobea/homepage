+++
title = "Exporting Minecraft Objects to Three.JS"
date = "2023-11-03T03:47:51-07:00"
+++

Recently, I've been working on some [interactive sketches/games](https://github.com/ameobea/sketches-3d) in Three.JS. For one of the levels I was building, I had the idea of importing something I built from one of my old MineCraft survival worlds in to use as part of it.

I figured that there was a pretty good chance of some software existing to export MineCraft levels to some 3D model format for 3D rendering or other purposes, and that indeed is the case. There are multiple options out there, but the one I chose to go with was [`jmc2obj`](https://github.com/jmc2obj/j-mc-2-obj/wiki/Getting-started).

## Exporting with `jmc2obj`

`jmc2obj` is a fairly minimalistic application which lets you export parts of a MineCraft world into .obj format - a very common and simple 3D object format. I chose it because it's very simple to install (just a standalone .jar file you can download), it's fully open source, and it has some pretty good docs and usage guides.

Its UI is pretty straightforward to use. You load your world, select the dimension to export, select the region of the world you want to export, set some export settings, and get a .obj file as output.

![Screenshot of the jmc2obj UI showing a superflat MineCraft world loaded in.  The UI shows several buttons and other controls for things like making and editing selections, changing settings, and loading different worlds.](https://i.ameo.link/bmj.png)

There are a good deal of options, but most are fine at their defaults and there are some [thorough docs](https://github.com/jmc2obj/j-mc-2-obj/wiki/Options) on them as well. Here are a few you might want to take a look at though:

- "Select blocks to export" if you want to filter out some blocks from the selection. I used this to get rid of torches, ladders, and some other stuff that I didn't want included in the generated model.
- "Export Textures" if you want the generated model to be textured with MineCraft textures. It will use the vanilla resource pack textures by default, but you can also load in your own resource pack.
  - Apparently there are also some special PBR resource packs that have things like normal maps built in. `jmc2obj` has support for these, and if you use one the resulting model's materials will be full-fledged PBR materials themselves.

After you run the export, you should have a .obj file and optionally some associated .mtl files. These contain the geometry and textures (if applicable) for your exported model respectively.

## Loading the .obj Model in Three.JS

Three.JS has built-in support for loading .obj and .mtl files, so it's actually possible to load the exported model into Three.JS directly.  After serving the generated files (.obj, .mtl, and the `tex` directory containing texture images), they can be loaded with code something like this:

```ts
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

const mtlLoader = new MTLLoader();
mtlLoader.load('/obj/mc-demo.mtl', materials => {
  materials.preload();
  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load('/obj/mc-demo.obj', obj => {
    scene.add(obj);
  });
});
```

After adding lights, orbit controls, and some light postprocessing, the result for my export looks like this:

![Screenshot of a MineCraft build exported via jmc2obj loaded into Three.JS with ObjLoader.  The build itself is a stone wall surrounding a grassy field with textures similar to the MineCraft defaults, floating in a black void.](https://i.ameo.link/bmk.png)

## Loading + Modifying the Model in Blender

This indeed works!  You can load these models into your world, add other stuff, and even integrate them with some physics engine like [rapier](https://rapier.rs/) or [ammo.js](https://github.com/kripken/ammo.js).

For my purposes, though, I wanted to do a bit more and move away from the default MineCraft aesthetic.  Since the exported .obj file is a standard 3D model, it's possible to work with it like any other 3D model.  I use Blender for all my 3D modelling, so I imported the .obj into Blender.  It's extremely easy - just File -> Import -> Wavefront (.obj) and you should see it loaded with textures:

![Screenshot of the MineCraft build exported via jmc2obj loaded into Blender.](https://i.ameo.link/bml.png)

### Re-Exporting to glTF + Building a Scene

Now that we're working in Blender, we can do a ton of stuff to the model.  I re-textured it completely to hide the fact that it's made out of individual blocks.  In blender, I hand-modelled some other objects to flesh out the scene.  Then, I re-exported it as a gLTF file which is a more modern and feature-rich model format which is very commonly used in Three.JS.

In Three.JS, I added in some more lighting, procedural terrain, and volumetric fog.  Here's the result:

![Screenshot of a scene in Three.JS.  It consists of a stone wall I built in MineCraft and exported via jmc2obj, volumetric fog, rocky procedural terrain, and some spooky green lighting.](https://i.ameo.link/bl4.png)

It's the same wall as the one from MineCraft, but the aesthetics are completely different.  I'm a big fan of the creative possibilities of using this kind of technique.
