---
title: 'Subdividing 3D Meshes for Displacement Mapping'
date: '2024-06-12'
opengraph: '{"image":"https://i.ameo.link/c7u.png","description":"A rundown of my experience and and findings for programmatically subdividing arbitrary 3D meshes for displacement","meta":[{"name":"twitter:card","content":"summary_large_image"},{"name":"twitter:image","content":"https://i.ameo.link/c7u.png"},{"name":"og:image:width","content":"826"},{"name":"og:image:height","content":"690"},{"name":"og:image:alt","content":"A screenshot of a simple mesh rendered in Three.JS with red arrows pointing out of its surface at various points, representing the computed normals of those vertices.  The mesh is colored in varying blue hues using Three.JS''s `MeshNormalMaterial` to visualize the interpolated normal at every point across its surface."},{"name":"twitter:image:alt","content":"A screenshot of a simple mesh rendered in Three.JS with red arrows pointing out of its surface at various points, representing the computed normals of those vertices.  The mesh is colored in varying blue hues using Three.JS''s `MeshNormalMaterial` to visualize the interpolated normal at every point across its surface."}]}'
---

<br/>

## Summary

When I started off, my goal was to procedurally subdivide arbitrary 3D meshes. I wanted to add more geometry to simple meshes so that I could apply displacement mapping and other procedural deformation to give them increased detail and realism in scenes.

It turns out that the core of subdividing meshes is very simple and can be implemented in a few dozen lines of code

<div class="warning padded">
However, there are considerations stemming from requirements of how shading and 3D rendering work that quickly become apparent and made it a much more involved task.
</div>

This post explores solutions to the various problems that occur when subdividing arbitrary 3D meshes and applying displacement while still making sure that they're rendered and shaded correctly.

## Background

I've been working on building little [3D levels](https://github.com/ameobea/sketches-3d) and other graphics experiments in Three.JS on and off over the past few years.

## Naive Subdivision

In 3D graphics, all meshes are composed out of triangles. When models are exported out of Blender or any other 3D modelling application, that application handles decomposing that mesh into a set of triangles that the 3D engine of the application rendering it turns into one or more draw calls to the GPU.

For my use case, I wanted to be able to subdivide _any_ 3D mesh and be able to do it using the post-export 3D data. The idea would be to take the set of triangles and turn them into more, smaller triangles.  One easy way to do that is to take each triangle that has an area greater than some threshold and cut it into two by splitting its longest edge.

Here's how that would look in Blender after 2 rounds of subdivision:

![A screenshot of Blender showing a triangle on the left and another triangle on the right that has undergone 2 rounds of subdivision by splitting its longest edge.  It now consists of 4 smaller triangles that take up the exact same original as the original one.](./images/subdivide/basic-subdiv-example.png)

In this case, the fact that everything was already a triangle actually makes it quite easy.  The algorithm I settled for looked like this:

```py
did_split = False
new_triangles = []

while did_split:
  did_split = False

  for triangle in triangles:
    if triangle.area() < target_triangle_area:
      new_triangles.append(triangle)
      continue

    longest_edge_ix = triangle.get_longest_edge_ix()
    new_tri_0, new_tri_1 = triangle.split_edge(longest_edge_ix)

    did_split = True
    new_triangles.append(new_tri_0)
    new_triangles.append(new_tri_1)
```

There's a slight bit of nuance that I omitted regarding things like the winding order of the vertices of new triangles so that they'd be facing the same way as the original one, but it's really nothing too complex.

And the best part is that it works!  I implemented this code, applied it to some simple test meshes, and saw that they looked... exactly the same.  That's just what should be happening in this case since we're not actually changing the overall shape of the geometry - just splitting it into smaller pieces.

## Displacement

Now that I had my meshes split, I figured I should test some basic displacement.

### Displacement Mapping Background

_Feel free to skip this section if you're already familiar with how displacement mapping works_

In 3D graphics, **displacement mapping** is a method for adding increased geometric detail to meshes by actually modifying the positions of its vertices in the vertex shader based on the values read from some texture - the **displacement map**.

The process itself is pretty simple. Each vertex is moved forward or backward along its normal vector depending on the value in the displacement map for that vertex, looked up using a dedicated UV map. Here's the full shader code for it from Three.JS for reference:

```glsl
transformed += normalize(objectNormal) * (texture2D(displacementMap, vDisplacementMapUv).x * displacementScale + displacementBias);
```

There's a price for this simplicity, though. In order for displacement mapping to look good, it's usually necessary to have another set of maps like normal maps or bump maps. If those are missing, the changes in geometry won't line up with the shading and things like specular highlights, shadows, and other elements of shading will look off or even break completely.

### Naive Subdivision Displacement Results

Rather than use a displacement map, I made a small tweak to my vertex shader to just apply a constant displacement outward for each vertex in the mesh.

Before I did this, I had to re-compute **normals** for my mesh.  In addition to being used for displacement as I mentioned before, normals are also used for shading.  They represent the vector perpendicular to the surface at each vertex.  These normals are then interpolated in the fragment shader for each pixel rendered and

## Normals

Since most meshes include a bunch of triangles that are connected together into a closed shell, that means that most vertices are going to be shared by more than one triangle. In order to more efficiently encode the mesh data to save GPU memory, raw mesh triangle data often comes in the form of **indexed vertices**. This means that there's one buffer (the vertex buffer) which contains the positions of unique vertices and then another buffer (the index buffer) which contains indices pointing into the vertex buffer for each triangle.

![A screenshot of a cube rendered in Three.JS with `MeshNormalMaterial` causing its three visible faces to be colored blue, pink, and purple.  There are additionally three red arrows rendered pointing out of each of the cube's vertices, pointing in directions aligned with the normals of each of the three faces that share that vertex.](./images/subdivide/cube-normals.png)

### Linked Mesh Data Structure

### Separate Shading + Displacement Normals

## "Auto-Smooth" Shading

## Procedural Displacement

## Assembling the Pieces

## Results
