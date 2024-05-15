---
title: 'Building Interactive Embedding Visualizations from Entity Collections'
date: '2024-05-14'
opengraph: '{"image":"https://i.ameo.link/c54.jpg","meta":[{"name":"twitter:card","content":"summary_large_image"},{"name":"twitter:image","content":"https://i.ameo.link/c54.jpg"},{"name":"twitter:image:alt","content":"A screenshot of an embedding visualization of beatmaps from the rhythm game osu!.  It shows a variety of circles of different colors arrayed on a black background."},{"name": "og:image:width", "content": "1200"}, {"name": "og:image:height", "content": "630"},{"name": "og:image", "content": "https://i.ameo.link/c54.jpg"},{"name": "og:image:alt", "content": "A screenshot of an embedding visualization of beatmaps from the rhythm game osu!.  It shows a variety of circles of different colors arrayed on a black background."}]}'
---

![A screenshot of an embedding visualization web application for the rhythm game osu!.  It shows a variety of colored circles arrayed on a black background with some circles highlighted and more opaque than the others.  There's a variety of UI components for searching, filtering, and viewing details about specific data points.](./images/building-embedding-vizs/osu-beatmap-atlas-header.png)

Over the past few years, I've built several different interactive embedding visualization applications.  I have a big interest in exploring and understanding things in a free-form manner, and these kinds of tools feel to me like an extremely effective way of facilitating that sort of experience.

My work in this area started out as an experiment using data I collected for a different project.  I then repeated it for other similar projects, tweaking the implementation based on the good/bad parts of the earlier efforts.

<div class="good padded"><b style="font-weight: 600;">After completing my most recent attempt, I believe I've come up with a solid process for building high-quality interactive embedding visualizations for a variety of different kinds of entity relationship data.</b></div>

I've compiled details about the whole process from start to finish along with my personal observations about what works and what doesn't here.  My hope is that it will be interesting or useful to anyone looking to build similar kinds of tools themselves.

## Background on Embeddings

 - Similarities (isomorphism?) to force-directed graphs

## Data Collection + Preparation

 - Pretty typical for most data science applications
 - Dumping everything to CSVs or other simple file formats for local use
   - Note that this may not be practical for extremely large data sets
 - Note that you'll have to translate often between indices and IDs, so plan for that

## Building the Correlation Matrix

 - Accelerating Python code with numba

## Building a Sparse Relationship Graph

 - PyMDE pre-processing to reduce the number of neighbors being vital to good performance and good embeddings

## Generating the Initial Embedding

 - PyMDE (vs. ggvec or others)
 - Hyperparam choice
   - Dimensionality
   - n_neighbors
     - (maybe this needs to go in the previous section, but definitely talk about this one)
     - Smaller values tend to work better (for my cases at least).
 - Performance implications
   - Using random initialization for the thing (figure out exactly which thing) instead of quadratic
   - I tried to use GPU accelerated quadratic initialization with limited success
 - More of an art than a science
 - Look for _structure_.
   - You want to see strands, globs, etc. rather than a big elliptical ball.
   - Include some of those images from music galaxy
 - In my experience, it's usually pretty obvious when things aren't working well
   - Examining the nearest neighbors or some well-known entities and sanity checking can go a long way

## Building an Interpretable 2D Embedding

 - Why we even need a second step here
   - PyMDE doesn't do a great job at generating good-looking 2D embeddings (for my data at least) by itself.
   - There are probably ways to coax it to do that with good custom constraints or similar, but I've found Emblaze to be too good to pass up.
 - Emblaze
   - Some good screenshots of use
 - UMAP vs. tSNE + hyperparams
   - tSNE tends to look quite nice and does good job creating highly-clustered "neighborhoods".  On the downside, it can move close neighbors very far from each other in the projection.
     - Hyperparams help but not a crazy amount
   - UMAP creates more of a pangea and can create very high-density areas.  However, it does an excellent job preserving both the local and global structure of the PyMDE-generated embedding.
     - Hyperparams (especially the min_distance one and n_neighbors) are very impactful and give a lot of control over the generated embedding

## Building the Visualization UI

 - Joining embedding coordinates with entity metadata
 - Static web UI
 - WebGL + Pixi.JS
   - Highly recommend Pixi.JS for building high-performance UIs with a nice high-level wrapper
   - Raw (or close to raw) WebGL isn't as bad as you might think if your visualizations are relatively simple like mine.  The whole thing can be rendered with a single draw call (Pixi can prob. do this too) and a single vert + frag shader

## Conclusion
