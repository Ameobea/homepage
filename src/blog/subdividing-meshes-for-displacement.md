---
title: 'Subdividing 3D Meshes for Displacement Mapping'
date: '2024-06-12'
opengraph: '{"image":"https://i.ameo.link/c7u.png","description":"A rundown of my experience and and findings for programmatically subdividing arbitrary 3D meshes for displacement","meta":[{"name":"twitter:card","content":"summary_large_image"},{"name":"twitter:image","content":"https://i.ameo.link/c7u.png"},{"name":"og:image:width","content":"826"},{"name":"og:image:height","content":"690"},{"name":"og:image:alt","content":"A screenshot of a simple mesh rendered in Three.JS with red arrows pointing out of its surface at various points, representing the computed normals of those vertices.  The mesh is colored in varying blue hues using Three.JS''s `MeshNormalMaterial` to visualize the interpolated normal at every point across its surface."},{"name":"twitter:image:alt","content":"A screenshot of a simple mesh rendered in Three.JS with red arrows pointing out of its surface at various points, representing the computed normals of those vertices.  The mesh is colored in varying blue hues using Three.JS''s `MeshNormalMaterial` to visualize the interpolated normal at every point across its surface."}]}'
---

<br/>

## Overview

When I started off, my goal was to create an algorithm to subdivide arbitrary 3D meshes. I wanted to add more geometry to simple meshes so that I could apply displacement mapping and other procedural deformation to give them increased detail and realism in procedurally and semi-procedurally-generated scenes.

Basic mesh subdivision is very simple and can be implemented in a few dozen lines of code. However,

<div class="warning padded">
There are requirements stemming from how shading and 3D rendering work that quickly become apparent and make it a much more involved task.
</div>

It turns out that there's a ton of nuance involved with subdividing and modifying 3D meshes while still making them render and shade nicely.

This post explores solutions to the various problems that occur during the whole subdivision and displacement process.  It then extends this into a full pipeline for displacing and manipulating 3D meshes and computing accurate normals for both shading and displacement.

## Naive Subdivision

In 3D graphics, all meshes are composed out of triangles. When models are exported out of Blender or any other 3D modelling application, that application handles decomposing that mesh into a set of triangles that the 3D engine of the application rendering it turns into one or more draw calls to the GPU.

For my use case, I wanted to be able to subdivide _any_ 3D mesh and be able to do it using the post-export 3D data. The idea would be to take the set of triangles and turn them into more, smaller triangles.  One easy way to do that is to take each triangle that has an area greater than some threshold and cut it into two by splitting its longest edge.

Here's how that would look in Blender after 2 rounds of subdivision:

![A screenshot of Blender showing a triangle on the left and another triangle on the right that has undergone 2 rounds of subdivision by splitting its longest edge.  It now consists of 4 smaller triangles that take up the exact same original as the original one.](./images/subdivide/basic-subdiv-example.png)

In this case, the fact that everything was already a triangle actually makes it quite easy.  The algorithm I ended up with looked something like this:

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

There's a bit of detail that I omitted regarding things like the winding order of the vertices of new triangles so that they'd be facing the same way as the original one, but it's really nothing too complex.

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

Rather than use a displacement map, I made a small tweak to my vertex shader to just apply a constant displacement outward for each vertex in the mesh.  This was more of a sanity check than anything to make sure that the subdivision really was working like I expected it to.

When I set it all up in my Three.JS scene, this is what I saw:

<iframe src="http://localhost:5173/subdivide/naive_displacement_demo" loading="lazy" style="width: 100%;aspect-ratio: 1530/1080;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

_(You can use the slider on the image above to view the pre and post displacement versions)_

As you can see, it definitely wasn't working like I was expecting.  Understanding why it turned out like this requires some some background into the way 3D rendering works.

## Normals

An extremely important concept for the rest of this post (and for 3D rendering in general) is that of **normals**.  A normal or normal vector is an angle perpendicular to something else.  For things like triangles or planes, its normal "shoots out" of its front side.

As a little aside, I was curious as to how these things got to be named "normals".

<div class="note padded">
It turns out that people have been calling right angles "normal" for <a target="blank" href="https://mathoverflow.net/questions/172690/how-did-normal-come-to-mean-perpendicular">over 2000 years</a>.  The use of normal to mean regular or standard is actually <a target="blank" href="http://www.etymonline.com/index.php?term=normal">much younger</a> apparently. Weird.
</div>

In 3D graphics, normals instead are assigned to vertices.  Each vertex gets a normal that is a weighted average of all faces that share it.  Blender, being the incredibly feature-rich application that it is, has built-in support for visualizing different kinds of normals on meshes.  Here's what it shows for a piece of that cube that was being rendered before:

![A screenshot of two rectangular faces joined together at a right angle, rendered in Blender.  There are lines of different colors rendered to visualize different kinds of normals including face normals, vertex normals, and split/loop normals.](./images/subdivide/blender-normals-viz.png)

The light blue lines are the face normals, the darker blue ones are the vertex normals produced by averaging the attached face normals, and the magenta ones are called "split" or "loop" normals.  I'll talk about those more later.

### Smooth + Flat Shading

Anyway, one of the main reasons that normals are so important for 3D rendering is the influence they have on shading.  Most of the equations used to simulate the way light interacts with surfaces rely on knowing the angle between the surface being lit and the light source and the angle between the surface and the camera.  Normals are essential for facilitating this.

Normals also provide the ability to switch between "smooth" and "flat" shading models.  With smooth shading, normals are interpolated for each fragment based on how close it is to each of its triangle's vertices.  This makes the effect computed normal at each fragment continuous across the whole surface of the mesh.

For flat shading, the normal for each fragment is set to the normal of the face.  This means that unique vertices need to be created for each face - even if those vertices are at exactly the same position - since they need to be assigned unique normals.

Here's a comparison between smooth (left) and flat (right) shading:

<div style="display: flex; flex-direction: row; justify-content: center;">
  <iframe src="http://localhost:5173/subdivide/smooth_flat_shading" loading="lazy" style="max-width: 821px;width: 100%;aspect-ratio: 821/756;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>
</div>

<br/>

That cube from before that I was testing displacement on was exported from Blender with flat shading.  This is definitely appropriate for that mesh; all of its faces are at very sharp angles to each other and trying to smooth over that would make it look weird.  However, this is exactly what broke the displacement.

In order to facilitate flat shading, Blender needed to 3 duplicate vertices at each of the cube's corners.  They had the exact same positions, but their normals differed to match the triangles they were used in.  This is what those magenta lines in the Blender screenshot from before represent.  They show the distinct normals that will exist in the exported mesh with the current shading model applied.

If the vertices are displaced using those magenta-colored split normals, the effect will be that vertices at the same starting point will be moved to different ending points.

<div class="note padded">
To make displacement work, new normals must be computed such that vertices at the same position are moved to the same destination, keeping the mesh glued together.
</div>

## Linked Mesh Data Structure

At this point, I realized that I needed to get a bit more sophisticated with the way I was representing meshes than the "just a bunch of triangles" system I was working with.

While reading various posts and libraries I'd run into in the past, I'd heard many mentions of a "half-edge" data structure.  This is a commonly used way to represent 3D meshes by "serious" libraries and tools.  It represents meshes as graphs with their constituent components (vertices, edges, and faces) all pointing to each other.  "Half-Edges" are used to refer to a single direction of an edge between two vertices going around a face.

I looked around to see if I could find a reasonably well-documented and maintained half-edge library in Rust, but I didn't find anything that looked appealing.

<div class="note padded">As a result, I decided to implement my own "<code>LinkedMesh</code>" data structure to represent meshes.</div>

It's similar to, and in many ways a simplification of, a half-edge data structure with some other differences:

 * No independent vertices or edges.  All vertices must be part of an edge, and all edges must be part of a face.
 * All faces are triangles.
 * No implicit direction on edges.  Instead, faces just hold an ordered list of references to the 3 vertices that make them up.

Just like a half edge data structure, it maintains links between the different entities like this:

<img src="https://i.ameo.link/c8n.svg" alt="A graph representing the relationships between vertices, edges, and nodes in the &quot;Linked Mesh&quot; data structure I developed.  It was produced using this graphviz dot code: digraph G {  rankdir=LR;  Vertex -> &quot;Edge&quot;;  &quot;Edge&quot; -> Vertex;  Face -> Vertex;  &quot;Edge&quot; -> Face;  Face -> &quot;Edge&quot;;}" style="width: 100%;"></img>

Having a representation like this makes a lot of things related to manipulating meshes a lot easier and/or more efficient.  For example, getting the list of all faces that border some other face is made very easy: just iterate over the face lists of all 3 edges.  There are multiple things coming up that this data structure will be crucial for.

### Implementation Details

Like the rest of the code for this, I implemented the `LinkedMesh` in Rust.  Although people often talk about how building linked data structures in Rust is difficult due to how the borrow checker works, the [`slotmap`](https://docs.rs/slotmap) crate makes this pretty much a non-issue.

Instead of storing pointers to other entities within them, you instead store special tagged indices into dedicated buffers.  This adds a slight bit of overhead, but it also provides additional checks which prevent bugs like using stale references to entities with the same index.

This is because the `SlotMap` keys contain a version which is incremented every time an index is updated, so a new entity inserted into a re-used index will have a distinct key from the old entity that used to be there.  This alone saved me a significant amount of time while developing and debugging the data structure.

Other than that, there really isn't a lot special going on in the implementation.  There were some tricky bugs to work out involving stale references that I forgot to delete or refresh after updating things in the graph, but everything eventually got working.

The whole thing lives in [one file](https://github.com/Ameobea/sketches-3d/blob/main/src/viz/wasm/common/src/mesh/linked_mesh.rs) as well which makes it easy to set up and use.  I added some methods to import and export it from buffers of indexed triangles - the raw data format I was working with before.

## Computing Separate Shading + Displacement Normals

Now back to the problem at hand.  The mesh data that we have to work with has multiple vertices at the same position to facilitate shading.  However, the normals that are used for displacement need to be identical for all coincident vertices.

<div class="note padded">
In order to support non-smooth shading and working displacement, two different sets of normals will need to be computed.
</div>

In order to compute normals for displacement, those coincident vertices need to be merged together.  To implement this, I just used a brute-force quadratic search of every `(vertex, vertex)` pair in the mesh.  If those two vertices were at exactly the same point, they got merged - updating references in all edges and faces to point to the first one and then dropping the second one from the graph.

For meshes I was working with, this was fast enough that the poor computational complexity didn't matter.  This was being run on the original low-resolution, pre-subdivision meshes after all.  If/when I end up using this with larger and more complex meshes, it will be necessary to use some space partitioning data structure like a BVH to speed it up.

### Graph Relation

Since the `LinkedMesh` data structure is in every way a graph, it's possible to visualize it as such.  I wrote some code to build a GraphViz representation of a linked mesh - originally for debugging purposes.

Here's the graph representation for that same mesh with the two square faces joined together at a right angle sharing one edge:

![A GraphViz-generated graph representation of a 3D mesh consisting of two square faces joined together at a right angle like a hinge.  The visualization shows two distinct subgraphs that are not connected together.  Each suhgraph contains exactly two faces - since a square faces are composed out of two triangles - that share one edge.  The graph is rendered as a dark theme with a dark gray background and white edges, node borders, and text.](https://i.ameo.link/c8q.svg)

Note how there are two distinct, disconnected subgraphs.  Each subgraph has exactly two faces, since a rectangle is composed out of two triangles.  These two triangles share exactly one edge with each other, and all other edges are only contained in one.

After the merge of coincident vertices if performed, here's what the resulting graph looks like:

![A GraphViz-generated graph representing a 3D mesh consisting of two square faces joined together at a right angle like a hinge after coincident vertices have been merged.  The visualization shows that all nodes are connected; there are no disconnected subgraphs.  Some vertices are now shared by up to four edges.  The graph is rendered as a dark theme with a dark gray background and white edges, node borders, and text.](https://i.ameo.link/c8r.svg)

As expected, the subgraphs are merged together and no disconnected components remain.  The two merged vertices now have 4 edges - lining up with what we see when the mesh is triangulated in Blender:

![A screenshot of a mesh consisting of two square faces joined together at a right angle like a hinge rendered in Blender.  It has been triangulated, showing that the two vertices making up the hinge edge are shared by a total of 4 edges each.](./images/subdivide/merged-hinge.png)

### Computing Vertex Normals

Now that all of the coincident have been merged in the graph representation, we can compute accurate vertex normals on the merged vertices such that displacing using them won't result in the faces of the mesh pulling apart from each other.

Previously, I mentioned that this is done by averaging the normals of attached faces and this is true.  However, when I was implementing this myself, I learned that there's actually a more specific algorithm that needs to be followed.

<div class="note padded">
Vertex normals need to be calculated by taking a <i>weighted</i> average the normals of connected faces, with the weights being the angles between edges of those faces that share that vertex.
</div>

That sounds a bit complex when written down like that, but it's actually pretty simple.  Seeing it visually helps:

![A screenshot of a mesh rendered in Blender.  There is one vertex selected which is shared by 3 edges and 2 faces.  The angles between the edges that share the vertex of those faces are marked with a red and a blue arc respectively to help demonstrate what the vertex normals are weighted by.](./images/subdivide/edge-angle.png)

The red and blue arcs are marking the angles that are being measured, which is what the normals of those two faces that share the selected vertex are weighted by when computing its normal.

If weighting isn't performed, the normals will be lopsided and inaccurate on some geometry and produce buggy/uneven shading and displacement results.

## "Smooth by Angle" Shading

As a result of the vertex merging, we obtain accurate displacement normals, the original shading data about which faces were smooth and which were flat is lost.  This has the effect of making the whole mesh smooth shaded.  If any other kind of shading than that is desired, we'll have to the work to compute it ourselves.

When computing shading normals, there are actually more options than just the binary "smooth" or "flat" that I've discussed so far.  Blender (and I'm sure other tools as well) provides an option called "Shade Smooth by Angle":

![A screenshot of the Blender UI showing the right-click menu on a mesh in object mode with the "Shade Smooth by Angle" option highlighted.  There is a tooltip displayed with the text "Set the sharpness of mesh edges based on the angle between the neighboring faces".](./images/subdivide/smooth-by-angle-blender.png)

This shading model works as a hybrid of smooth and flat shading.  It looks at the angle of edges between faces and if the angle is too large, it marks the edge as "sharp".  This essentially has the effect of duplicating the vertices of that edge - reversing the merge process from the previous step.  This allows the faces that share that sharp edge to have different normals on it and making the edge appear flat-shaded when rendered.

That seems simple enough, right?

That's what I thought until after I'd spent a full weekend trying to come up with an algorithm to do this from scratch.

I tried a variety of ideas including a graph traversal-type approach where I'd walk along smooth faces and build up "smooth subgraphs".  All of these failed in at least some places, producing all kinds of weird buggy shading artifacts like this:

![A screenshot of a zoomed-in section of a mesh in Blender rendered with `MeshNormalMaterial`  There are clear triangular artifacts along the edge of the mesh where the computed normals are incorrect, leading to a green zigzag of incorrectly shaded triangles to appear along the correctly shaded blue background.](./images/subdivide/bad-auto-smooth-artifacts.png)

Finally, I gave up on doing it myself.

<div class="note padded">
I tracked down <a href="https://github.com/blender/blender/blob/a4aa5faa2008472413403600382f419280ac8b20/source/blender/bmesh/intern/bmesh_mesh_normals.cc#L1081" target="_blank">the spot</a> in the Blender source code where they do this themselves, figured out what was going on, and implemented it myself for the <code>LinkedMesh</code> in Rust.
</div>

The algorithm they use is quite clever.  At its core, the algorithm involves walking around vertices and partitioning the faces into what they call "smooth fans".  Each smooth fan gets its own copy of that vertex with a unique shading normal.

There's a bit more to it than that, and I went ahead and wrote a [dedicated post](/blog/computing-smooth-by-angle-shaded-normals-like-blender/) about the algorithm and how I implemented it if you're interested.

The only important thing left to note about it here is that when I duplicate a vertex in order to make one of its edges sharp, the displacement normal computed earlier is copied to the new one.  This ensures that regardless of what shading normal that duplicate vertex gets assigned, they all will be displaced in the same way and the mesh won't rip apart.

## Procedural Displacement

So at this point, I had the following:

 * A method for converting arbitrary sets of triangles into a graph-like `LinkedMesh` representation
 * An algorithm for merging coincident vertices and computing displacement normals such that the mesh won't rip apart when displaced
 * An algorithm for computing "smooth by angle" normals for shading
 * An algorithm to subdivide the resulting `LinkedMesh` to add increased geometric detail without changing its shape

Now we get to actually do some displacement.

Rather than doing it inside the vertex shader like before, I decided to implement the displacement/deformation ahead of time on the CPU.  There are a few reasons for this:

 * It allows for more complicated/expensive algorithms to be run.
 * It allows for non-local data about the mesh to be used rather than just a single vertex

And perhaps most the impactful,

 * It allows for other things than just vertex positions to be computed + updated as well

As I mentioned at the beginning of the post, displacement mapping is limited by the fact that it happens so late in the rendering process.  If you significantly displace your mesh's vertices without having a corresponding normal map or something else to match it, the results are going to look off.

<div class="good padded">
Since I now had fully-fledged smooth-by-angle normal computation code available, I could go as wild as I wanted with the mesh deformation and then compute accurate normals from scratch afterwards.
</div>

### Noise-Based Displacement

The first thing I tried out was a noise-based displacement algorithm.  I sampled a 3D FBM noise field with 4 octaves at the position of every vertex in the mesh and either pushed or pulled the vertex along its normal depending on the sampled value.

Here are the results:

<iframe src="http://localhost:5173/subdivide/noise_displ" loading="lazy" style="width: 100%;aspect-ratio: 3456/1895;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

Quite successful, if I do say so myself.  This is a bit of an extreme example with a very high amount of displacement, but that helps to exaggerate the impact that the post-displacement normal calculation has on the shadows and shading.

### Crystal-Like Sharp Noise

I wanted to try out another displacement algorithm that would help make use of the dynamically flat shading abilities of the algorithm.

I modified the noise-based method to displace sharply based on a threshold, like this:

```rs
let displacement = if noise > -0.9 && noise < -0.7 { 1. } else { 0. };
```

And here was the result of that:

![A screenshot of the clamped threshold noise used for displacement on the scene.  The are sharp spikes sticking out of the surface of the platform and some of the other objects floating above it that look somewhat reminiscent of crystals.](./images/subdivide/crystal-noise.png)

Smooth-by-angle shading's effect is out in full force - look at the base of the spikes where they join to the surface of the mesh.  Those edges get marked sharp due to the high angle at which it juts out, and the result is a nice flat shading distinction between the faces.

When I saw the results here, I immediately got ideas for all kinds of other things to try out.  I could repeat the displacement process multiple times to build up more and more detail on the meshes, I could use constructive solid geometry to combine multiple simple meshes together then displace the merged result...  So much stuff is possible with this system.

This post has already gotten very long though, so I'll save all that stuff for another time.

## Other Notes + Considerations

While setting this process up, came up with a list of misc. things that I ran into or observed that might be useful to other people trying to do similar kinds of things:

### Shading Normal Calculation Order

One thing I noticed when doing subdivision with minimal or no displacement was that sometimes triangular shading artifacts would show up on edges between flat faces:

TODO

### Retaining Sharp Edges

### Displacement Normal Interpolation Method

If you remember back, the process for doing this displacement involved merging coincident vertices and then computing displacement normals for those merged vertices.  After that, the mesh was subdivided to add more detail followed by displacement.

<div class="note padded">
One thing I didn't mention is how displacement normals are computed for the new vertices created by the subdivision process.
</div>

My original solution for this was to just interpolate the displacement normals of each edge being split and set that to the new vertex created in the middle.

As it turns out, this works the best for the kind of displacement I was doing.  However, it can create a sort of "bouncy house" look to the geometry.  Here's what it looks like when every vertex is displaced outward along its normal by a constant amount using this method:

<iframe src="http://localhost:5173/subdivide/bouncy_house" loading="lazy" style="width: 100%;aspect-ratio: 3456/1985;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

See what I mean?  To be fair, this is a pretty extreme amount of displacement being applied, so it's not going to be as noticeable for other meshes.

The other method I came up with for setting displacement normals for new vertices created during subdivision is setting them to the edge normal.  The edge normal can be computed ahead of time by just averaging the normals of all faces that share the edge.

Here's how the same scene looks using that method:

<iframe src="http://localhost:5173/subdivide/edge_normals" loading="lazy" style="width: 100%;aspect-ratio: 3456/1985;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

The tops are flat now, but there are some weird graphics glitches and other artifacts.  I don't know if that's an issue with my code somewhere or a side effect of the kind of geometry this produces.

Anyway, I'd suggest going with the interpolated displacement normals to start with and only resorting to the second method if your particular displacement method requires it.

### UV Maps + Triplanar Mapping

## Conclusion
