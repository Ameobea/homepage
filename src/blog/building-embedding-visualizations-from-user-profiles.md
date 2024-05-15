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

## Background on Embeddings + Embedding Visualizations

Embeddings are nothing more than a bunch of entities that are each assigned a coordinate in n-dimensional space.  These entities can be things such as words, products, people, tweets - anything that can be related to something else.  The idea is to pick coordinates for each entity such that similar/related entities are near each other and vice versa.

Much of the time when embeddings are referred to, it's in the context of deep learning.  Word embeddings are a critical piece of LLMs and as such they've gotten a decent amount of attention in recent years.  These embeddings are usually quite high-dimensional with hundreds or thousands of dimensions, meaning that each entity gets assigned a vector.

These large numbers of dimensions provide embeddings the ability to encode complicated relationships between entities other than just similar/dissimilar.  If two things share some abstract quality with each other but are otherwise dissimilar, they can be close to each other in some dimensions while remaining distant in others.  This enables some of the very cool examples like the famous [king + man - woman = queen](https://www.ed.ac.uk/informatics/news-events/stories/2019/king-man-woman-queen-the-hidden-algebraic-struct) and makes embeddings so useful for encoding rich information about things.

The human brain doesn't do well with working with high-dimensional data like this.  For this reason, when visualizing embeddings, it's common practice to "project" embeddings down to 3 or 2 dimensions in order to be able to visually interpret its structure and understand the relationships between the entities it represents.

Through my work and experiments in this area, I've discovered that there's a fair amount of nuance to doing this in a way that produces a useful and interpretable visualization at the end.

## What I've Built

To give a bit of background on the kinds of things that you can get with this technique, here's what I've built so far:

### Spotify Music Galaxy

![A screenshot of the music galaxy project showing a zoomed-out view of the visualization.  There are a variety of star-like cyan-colored spheres arrayed out on a nebula-like background with gold lines connecting some of them.  Some of the points are labeled with black labels with white text containing the names of musical artists that they represent.  There's the title "Music Galaxy" in white text in the bottom right.](../images/projects/music-galaxy-twtr.png)

This was the first one I created and it's 3D!  I created it using data I collected from the Spotify public API that takes the form of "Users who listened to artist X also listened to artist Y".

It's implemented as [web application](https://galaxy.spotifytrack.net/) built with Three.JS.  I give users the ability to fly around using video game-like controls as well as the ability to connect their Spotify account to see which parts of the galaxy their favorite artists are in.

### Anime Atlas

!["A screenshot of the anime atlas embedding visualization showing the UI and a section of the embedding with labels and markers indicating which ones the user has watched.  There is a variety of UI for showing a color scale legend and picking which embedding to load.](../images/projects/anime-atlas.png)

This one as mostly a case of I happened across the data and thought it would be cool to try.  I downloaded the MyAnimeList profiles of a few hundred thousand users and used those to embed all the different anime on the site.

I wanted to create something a bit easier to engage with, so I built this one was 2D.  I [embedded it](https://anime.ameo.dev/pymde_4d_40n) (haha) within an anime stats and recommendations site I built alongside it.

### osu! Beatmap Atlas

This one I just finished recently, and is the one featured in the header image.

For almost a decade now (holy shit), I've run a [stats tracker](https://ameobea.me/osutrack/) website for the popular rhythm game [osu!](https://osu.ppy.sh/).  In this game, you play different maps for songs (called beatmaps) and your best plays can be retrieved from a public API.

I used the data I've collected from that project to embed these beatmaps in a very similar way to the Anime Atlas project.  This project is especially cool to me since there is a lot of really detailed numeric metrics about each of these beatmaps that directly relates to gameplay, making the resulting visualization very interesting to explore.

## Data Collection + Preparation

One thing you do need is to have some way to tell if and how much two different entities are related to each other.  For the Spotify Music Galaxy this came directly from Spotify's API where they did the hard work themselves.  For the other two, this data came in the form of "This user had all of these entities in their profile".  Each entity in that profile was treated as related to each other entity with a domain-specific weighting.

Any data you're working with will probably have its own caveats and peculiarities, but as long as you have some way of taking it and creating some metric for how related/similar two entities are, it should work fine.

### Pre-Filtering

Depending on how much data you have, you may need to do some initial filtering on the raw data to reduce it to a size that's manageable for visualization.  A common thing I did when creating mine was to drop very rarely seen or "uninteresting" entities from the set completely before proceeding.

If you have a huge amount of low-degree data points, it can result in a cluttered and uninteresting visualization.  Having a massive number of entities will also make all of the code for building the embedding slower as well as potentially making the embedding visualization itself slower for users.

I've personally found that the sweet spot is somewhere between ~10k-50k entities for the kinds of visualizations I make.  You can probably get away with more if you use an efficient rendering method and maybe provide some ways for the users to slice + filter the visualization itself.

### Misc. Notes

Some additional lower-level things to keep in mind when doing your data collection and collation:

Most of the tools and processes you're going to be doing to produce the embedding will refer to entities by index rather than any kind of domain-specific ID.

<div class="note padded">Once you have a collection of entities you plan to embed, I usually create an ID to index mapping as early as possible that can be referred to throughout the rest of the process.</div>

This also makes things easier when joining the embedded points back with metadata at the end of the process.

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
 - Dealing with high-degree nodes when rendering (partial log scale for point size)

## Conclusion
