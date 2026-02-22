---
title: 'Generating Smooth Parametric Meshes from Scratch TODO BETTER TITLE'
date: '2026-02-13'
description: "TODO"
imageWidth: 1
imageHeight: 1
imageUrl: 'https://i.ameo.link/TODO.png'
imageAlt: 'TODO'
---

## Background

For the past several months, I've been working on a programming language called Geoscript for generating and manipulating 3D geometry.  I'm developing it alongside a web app called [Geotoy](https://3d.ameo.design/geotoy) which serves as a Shadertoy-inspired platform use Geoscript and share compositions with other users.

I've been steadily building up Geoscript's collection of builtin geometry functions and primitives over time, trying to expand the kind of structures it can comfortably generate.  I've been especially focused on parametric surface construction and the ability to create smooth, organic-looking shapes.

After much experimentation and failed attempts, I've managed to get some pretty cool results.  This post goes over the tricks and techniques I strung together to make it all work end to end.

## Initial Beveling Attempts

The most basic example of the kind of shape I wanted to be able to generate is a simple rounded cube.  Here's an example of one that I created in Blender by applying a "bevel edges" operator to the starting cube:

![A screenshot of a beveled/rounded cube modeled in Blender.  It shows a hybrid wireframe view showing the multiple cuts used to make the bevel smooth.](./images/smooth-parametric-meshes/blender-beveled-cube.png)

When first considering how to implement a procedural bevel operator myself, my initial thought was that it would be "simple enough".  Just cut the faces a bit before the edge and then bridge them with some new edges following the kind of shape you want to create.

<div class="warning padded">
However, it quickly become apparent that implementing even a simple version of this would be very far from simple.
</div>

I quickly realized that a lot of the complexity comes in at the vertices where two edges being beveled meet.  You can see in the Blender screenshot above how the corners have a nice rounded pattern that continues smoothly into all three incoming edges.

The more I looked into it, the more complexity and edge cases I realized were present even in relatively simple cases.  I still had some hope that I might be able to get some minimal version of it working until I checked the [Blender source code](https://github.com/blender/blender/blob/fca1354acf649fd7397993f7ef60bdda7b4c5b3b/source/blender/bmesh/tools/bmesh_bevel.cc) for their bevel operation.  It has over 8000 LoC in just that file, so not counting helper data structures and other geometry utilities that they make use of.

<div class="note padded">
At that point, I realized that an effort to add a generic bevel operator to geoscript would either result in a multi-month side quest or a buggy, half-baked mess.
</div>

Neither of those options sounded attractive, so I decided to try a different approach.

## Smooth Parametric Surfaces from Scratch

Rather than smoothing meshes out as a post-processing step, I pivoted my efforts to generating meshes that are smooth from the start.

## Cap Triangulation

<iframe src="https://3d.ameo.design/geotoy/embed/50" loading="lazy" style="width: 100%;min-height:300px;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

## Intelligent Stitching Algorithm

<iframe src="https://homepage-external-mixins.ameo.design/smooth_procedural_meshes/delta_t_penalty_comparison_wireframe.html" loading="lazy" style="width: 100%;aspect-ratio: 2058/1973;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

<iframe src="https://homepage-external-mixins.ameo.design/smooth_procedural_meshes/delta_t_penalty_comparison_normal.html" loading="lazy" style="width: 100%;aspect-ratio: 2058/1982;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

## Adaptive Contour Sampling

![A screenshot of a mesh rendered with a magenta wireframe view in Three.JS.  The mesh consists of a smooth rounded square shape which morphs into a more complex shape along its span.  The wireframe shows how there is more geometric detail assigned to the curved corners of the rounded square at the beginning of the mesh, but that detail gets re-distributed to the new details further along the mesh.](./images/smooth-parametric-meshes/adaptive-sampler-at-work.png)
