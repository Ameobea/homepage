---
title: 'Building Interactive Embedding Visualizations from Entity Collections'
date: '2024-05-14'
opengraph: '{"image":"https://i.ameo.link/c54.jpg","meta":[{"name":"twitter:card","content":"summary_large_image"},{"name":"twitter:image","content":"https://i.ameo.link/c54.jpg"},{"name":"twitter:image:alt","content":"A screenshot of an embedding visualization of beatmaps from the rhythm game osu!.  It shows a variety of circles of different colors arrayed on a black background."},{"name": "og:image:width", "content": "1200"}, {"name": "og:image:height", "content": "630"},{"name": "og:image", "content": "https://i.ameo.link/c54.jpg"},{"name": "og:image:alt", "content": "A screenshot of an embedding visualization of beatmaps from the rhythm game osu!.  It shows a variety of circles of different colors arrayed on a black background."}]}'
---

![A screenshot of an embedding visualization web application for the rhythm game osu!.  It shows a variety of colored circles arrayed on a black background with some circles highlighted and more opaque than the others.  There's a variety of UI components for searching, filtering, and viewing details about specific data points.](./images/building-embedding-vizs/osu-beatmap-atlas-header.png)

Over the past few years, I've built several different interactive embedding visualization applications.  I have a big interest in exploring and understanding things in a free-form manner, and these kinds of tools feel to me like an extremely effective way of facilitating that sort of experience.

My work in this area started out as an experiment using data I collected for a different project.  I then repeated it for other similar projects, tweaking the implementation based on the good/bad parts of the earlier efforts.

<div class="good padded">After completing my most recent attempt, I believe I've come up with a solid process for building high-quality interactive embedding visualizations for a variety of different kinds of entity relationship data.</div>

I've compiled details about the whole process from start to finish along with my personal observations about what works and what doesn't here.  My hope is that it will be interesting or useful to anyone looking to build similar kinds of tools themselves.

## Background on Embeddings + Embedding Visualizations

Embeddings are nothing more than a bunch of entities that are each assigned a coordinate in n-dimensional space.  These entities can be things such as words, products, people, tweets - anything that can be related to something else.  The idea is to pick coordinates for each entity such that similar/related entities are near each other and vice versa.

Much of the time when embeddings are referred to, it's in the context of deep learning.  Word embeddings are a critical piece of LLMs and as such they've gotten a decent amount of attention in recent years.  These embeddings are usually quite high-dimensional with hundreds or thousands of dimensions, meaning that each entity gets assigned a vector.

These large numbers of dimensions provide embeddings the ability to encode complicated relationships between entities other than just similar/dissimilar.  If two things share some abstract quality with each other but are otherwise dissimilar, they can be close to each other in some dimensions while remaining distant in others.  This enables some of the very cool examples like the famous [king + man - woman = queen](https://www.ed.ac.uk/informatics/news-events/stories/2019/king-man-woman-queen-the-hidden-algebraic-struct) and makes embeddings so useful for encoding rich information about things.

The human brain doesn't do well with intuitively understanding high-dimensional data like this.  For this reason, when visualizing embeddings, it's common practice to "project" embeddings down to 3 or 2 dimensions in order to be able to visually interpret its structure and understand the relationships between the entities it represents.

Through my work and experiments in this area, I've discovered that there's a fair amount of nuance to doing this in a way that produces a useful and interpretable visualization at the end.

## Why Embedding Visualizations

The "algorithm" is a ubiquitous concept on the modern internet.  Everything around us online is trying to optimize our experience (or more accurately our engagement) by giving us content that it thinks we're most likely to have interest in or interact with.

Behind the scenes, it's very likely that the recommendation models are using embeddings or something very similar to them to achieve this.  Embedding visualizations allow for a self-led and exploratory way to find new things compared to the one-dimensional and opaque view given by "for you" lists or recommendation engines.

<div class="note padded">I have a lot of interest in breaking through the black box of these kinds of opaque systems and piecing together the hidden relationships between things - and I've found embedding visualizations to be ideal tools for this.</div>

Besides being useful for targeted searches, I also just find it fun to browse around and explore embedding visualizations.  It feels really natural and enjoyable to move around and manipulate a "space".  It reminds me a lot of flying around Google Earth and just checking out and exploring random cool places.

## My Embedding Visualization Projects

To give a bit of background on the kinds of things that you can get with this technique, here's what I've built so far:

### Spotify Music Galaxy

![A screenshot of the music galaxy project showing a zoomed-out view of the visualization.  There are a variety of star-like cyan-colored spheres arrayed out on a nebula-like background with gold lines connecting some of them.  Some of the points are labeled with black labels with white text containing the names of musical artists that they represent.  There's the title "Music Galaxy" in white text in the bottom right.](../images/projects/music-galaxy-twtr.png)

This was the first one I created and it's 3D!  I created it using data I collected from the Spotify public API that takes the form of "Users who listened to artist X also listened to artist Y".

It's implemented as [web application](https://galaxy.spotifytrack.net/) built with Three.JS.  I give users the ability to fly around using video game-like controls as well as the ability to connect their Spotify account to see which parts of the galaxy their favorite artists are in.

### Anime Atlas

!["A screenshot of the anime atlas embedding visualization showing the UI and a section of the embedding with labels and markers indicating which ones the user has watched.  There is a variety of UI for showing a color scale legend and picking which embedding to load.](../images/projects/anime-atlas.png)

This one as mostly a case of I happened across the data and thought it would be cool to try.  I downloaded the MyAnimeList profiles of a few hundred thousand users and used those to embed all the different anime on the site.

I wanted to create something a bit easier to engage with, so I built this one was 2D.  I [embedded it](https://anime.ameo.dev/pymde_4d_40n) (lol) within an anime stats and recommendations site I built alongside it.

### osu! Beatmap Atlas

This one I just finished recently, and is featured in the header image.

For almost a decade now (holy shit), I've run a [stats tracker](https://ameobea.me/osutrack/) website for the popular rhythm game [osu!](https://osu.ppy.sh/).  In this game, you play different maps for songs (called beatmaps) and your best plays can be retrieved from a public API.

I used the data I've collected from that project to embed these beatmaps in a very similar way to the Anime Atlas project.  This project is especially cool to me since there is a lot of really detailed numeric metrics about each of these beatmaps that directly relates to gameplay, making the resulting visualization very interesting to explore.

## Data Collection + Preparation

One thing you do need is to have some way to tell if and how much two different entities are related to each other.  For the Spotify Music Galaxy this came directly from Spotify's API where they did the hard work themselves.  For the other two, this data came in the form of "This user had all of these entities in their profile".  Each entity in that profile was treated as related to each other entity with a domain-specific weighting.

Any data you're working with will probably have its own caveats and peculiarities, but as long as you have some way of taking it and creating some metric for how related/similar two entities are, it should work fine.

### Pre-Filtering

Depending on how much data you have, you may need to do some initial filtering on the raw data to reduce it to a size that's manageable for visualization.  A common thing I did when creating mine was to drop very rarely seen or "uninteresting" entities from the set completely before proceeding.

If you have a huge amount of low-degree data points, it can result in a cluttered and uninteresting visualization.  Having a massive number of entities will also make all of the code for building the embedding slower as well as potentially making the embedding visualization itself slower for users.

I've personally found that the sweet spot is somewhere between ~10k-50k entities for the kinds of visualizations I make.  You can probably get away with more if you use an efficient rendering method and maybe provide some ways for the users to slice + filter the visualization itself.

### Notes

Some additional lower-level things to keep in mind when doing your data collection and collation:

Most of the tools and processes you're going to be doing to produce the embedding will refer to entities by index rather than any kind of domain-specific ID.

<div class="note padded">Once you have a collection of entities you plan to embed, I usually create an ID to index mapping as early as possible that can be referred to throughout the rest of the process.</div>

This also makes things easier when joining the embedded points back with metadata at the end of the process.

## Building the Co-Occurrence Matrix

The foundation of the embedding-building process involves creating a _co-occurrence matrix_ out of the raw source data.  This is a square matrix where the size is equal to the number of entities you're embedding.  The idea is that every time you find `entity_n` and `entity_m` in the same collection, you increment `cooc_matrix[n][m]`.

For some types of entities, you may have some additional data available that can be used to determine to what degree two entities are related.  For my osu! beatmap embedding, for example, I weighted the amount of added value based on how close the two beatmaps were in amount of performance points awarded.  This served to steer beginner and advanced maps from appearing related to each other.

If your entities have an associated timestamp for when they were added to the collection, you could also weight the similarity by how close they are.  Although embeddings will likely encode some of this temporal relationship naturally, this can be useful in some cases.

### Memory Considerations

Since co-occurrence matrices are square, they grow exponential with the number of entities being embedded.  For 50k entities and a 32-bit data format, the matrix will already be at 10GB.  100k entities puts it at 40GB.

If you are trying to embed even more entities than that or have limited RAM available, you may need to use a sparse representation for the matrix.  I've found good success using the `coo_matrix` and `csc_matrix` types from the `scipy.sparse` Python library for this.  As an added bonus, many of the downstream libraries used for building the embeddings can work with these sparse matrices natively.

### Performance Considerations

The main loop for constructing this co-occurrence matrix looks something like this:

```py
cooc_matrix = np.ndarray((n_entities, n_entities))

for collection in collections:
  for i in range(len(collection) - 1):
    entity_i_ix = entity_ix_by_id[collection[i].id]

    for j in range(i + 1, len(collection)):
      entity_j_ix = entity_ix_by_id[collection[j].id]

      cooc_matrix[i][j] += 1
```

This is `O(n^2)` wrt. the size of the collection being processed.

<div class="warning padded">Because of this, if you have even modestly large collections, the process of generating the co-occurrence matrix can be quite computationally intensive.</div>

Since Python is far from the fastest language, this means that generating the matrix can be extremely slow.  While I was iterating on my process and experimenting with different data and setups, I often found myself waiting for hours for the matrix to be computed.

As a solution for this, I used the excellent `numba` library for Python.  `numba` JIT-compiles Python on the fly to allow it to run many times faster.  If you're lucky, it can be as easy as just adding a `@jit(nopython=True)` decorator on top of your function and enjoying vastly improved performance.  It can even automatically parallelize loops in some case with `parallel=True`.

`numba` is aware of and compatible with some common Python data libraries like `numpy`, but for others (including the sparse matrices from `scipy`) it won't work.  For this case, I ended up having to do some manual data chunking and shuffling to make it work, but it was worth it in the end.

## Building a Sparse Entity Relationship Graph

Once you've built your co-occurrence matrix, you have all the data that you need to create the embedding.  The In fact, it's possible to go ahead and directly embed that matrix - treating it as a weighted graph.

I've tried this, and the results are not good.  The embeddings that come out look like elliptical galaxies:

![An image of an elliptical galaxy known as IC 2006 taken by the Hubble Space Telescope.  It appears as a bright, roughly round mass of white stars with density increasing steadily towards the center.  There are many other small stars and galaxies visible in the background. Public domain.](./images/building-embedding-vizs/Elliptical_galaxy_IC_2006.jpg)

There is little discernable structure and a dense mass of high-degree entities grouped at the center.  It's not interesting to look at and doesn't convey much useful information other than which entities are the most popular.

I believe the reason for this is two-fold:

 * The co-occurrence graph is simply far too dense
 * Edge weights for popular high-degree nodes are far too large in comparison to the vast majority of other edges

To make this graph ready for embedding, both of these points need to be addressed.

### PyMDE Pre-Processing

I think now's a good time to introduce [PyMDE](https://pymde.org/).

PyMDE is a Python library implementing an algorithm called [Minimum Distortion Embedding](https://web.stanford.edu/~boyd/papers/min_dist_emb.html).  It's the main workhorse of the embedding-generation process and very powerful.

We'll get into more later, but one of the things this library provides is a set of [preprocessing routines](https://pymde.org/preprocess/index.html) - one of which does exactly what we're looking for.  It's called [`pymde.preserve_neighbors`](https://pymde.org/api/index.html#pymde.preserve_neighbors).

This routine takes a graph as input and returns another sparser graph as output.  It addresses both points above by returning a sparser graph as output as well as un-weighting all the edges.

Internally, it achieves this by computing k-nearest neighbors for each node in the graph.  It drops all but the `k` top edges for each node and sets their weights to 1.  It will also fill in edges for very uncommon or loosely connected nodes which can be useful for some data sets.

One thing to note is that this function interprets edge weights as _distances_: bigger weights are treated as being more dissimilar rather than more similar.

To work around this, I apply `1 / log(x)` to all of the values in the co-occurrence matrix before passing it to `pymde.preserve_neighbors`.  This in effect converts it from a similarity matrix into a dissimilarity matrix.

In addition to the dissimilarity matrix, `pymde.preserve_neighbors` accepts a few parameters that are very impactful to the generated embedding.

### `n_neighbors`

This defines the `k` used for the KNN computation.  The bigger this value, the denser the resulting graph will be.

The best value for this variable depends pretty heavily on your data.  The size of your collections, the number of entities you're embedding, and the popularity distribution of your entities all play a role.

<div class="note padded">This <code>n_neighbors</code> parameter is one of the things I highly suggest experimenting with and trying different values with to see what works best for your data.</div>

That being said, for the data sets I've worked with, I've found that values from ~10-40 work best.  Smaller honestly seems to be better than larger for encouraging embeddings with interesting structure to emerge.

### `embedding_dim`

Although this isn't directly used by the pre-processing code, it is used to configure the PyMDE instance that is returned and will be used to actually generate the embedding later on.

<div class="note padded"><code>embedding_dim</code> is probably the most important parameter for this pre-processing - and perhaps the most important and impactful parameter for the whole embedding process!</div>

You might think that this should obviously be set to 2 if you're building a 2D visualization.  And you're right: setting this to 2 will indeed configure PyMDE to generate 2-dimensional coordinates for each entity.  You could then use those directly in whatever visualization you end up building if you wanted.

However, I've personally found that low-dimensional embeddings produced by PyMDE directly don't look very visually appealing.

The library does a terrific job preserving the relationships and information encoded in the input graph in its output, but those outputs aren't designed for direct viewing by humans.  They're great for use as feature vectors for machine learning though, for example.

So I've actually found that it's best to embed into a higher dimension as an intermediary step and then use a different algorithm to project _that_ down to 2 dimensions.  I've found that pretty low values for that intermediate embedding dimension work best, so I'd start with 3 or maybe 4 and see how it works for you.  Using higher dimensions leads to too much information loss when projecting down to 2.

### Performance Considerations

In the past, I've observed this pre-processing step taking an extremely long time.  So long that I gave up on it ever finishing.

It turns out that PyMDE tries to compute a "quadratic initialization" for some part of the process.  Given that name, I imagine it's another instance of `O(n^2)` time complexity coming into play.  I found that you can disable that by passing `init="random"` to the `pymde.preserve_neighbors` function.  I imagine that this slightly reduces the quality of some part of the process, but I didn't notice anything myself.

There's also an option to move this to the GPU by setting `device='cuda'`.  I tried this with some success, but I did run into issues with my GPU running out of memory in some cases.  Feel free to give that a shot if you have a CUDA-enabled GPU on hand.

## Generating the Initial Embedding

Once `preserve_neighbors` finishes running, it returns a `MDE` object.  This contains the configuration parameters you passed earlier along with the generated KNN graph from the pre-processing.

Once you've made it this far, taking that and generating an embedding is actually super easy:

```py
embedding = mde.embed(verbose=True, max_iter=2000, print_every=50)
```

It doesn't even take that long to run.  You can then create a quick visualization of the result with this:

```py
mde.plot(colors=['black'])
plt.show()
```

PyMDE will automatically project the embedding down into 3D if you chose a higher dimension count than that.  Here's an example of what you should see if things worked well:

![A screenshot of a 3D scatter plot representing an embedding produced by PyMDE.  There are a variety of black dots arrayed in a mass with axis markers on the bottom and two sides.  There are significant density variations between different parts of the mass and lots of visible structure.](./images/building-embedding-vizs/pymde_embedding_viz.png)

### PyMDE vs. Alternatives

There are other libraries available other than PyMDE for generating embeddings from graphs.  When I was first working with embeddings, I tried some of them.

One of these is called [`ggvec`](https://github.com/VHRanger/nodevectors).  It seems to be specialized for extremely large data sets and optimized for speed.  Some of their examples show use cases of embedding graphs with >500k nodes.

Although it was indeed very fast and worked pretty well, I found the embeddings it produced to be sub-par compared to those created by PyMDE.  It might be a great option if you have a huge embedding corpus, though.

### Evaluating Embedding Quality

At this point, even just based on this tiny crude plot, it's usually possible to tell pretty confidently if the embedding is good or not.

The main thing you want to look for is _structure_.  Notice how in the image above there are lots of variations in density and shape while still maintaining a cohesive shape.  I'd consider that to be an excellent result.

Here's an example of an embedding that I'd consider to be low-quality, taken from my experiments while building the Music Galaxy project:

![A screenshot of a 3D embedding visualization created while building the Music Galaxy project.  It shows a tangled mass of blue-ish lines and spheres in 3D space, slightly reminiscent of an elliptical galaxy.  There is a dense center that spreads out into a sort of cone shape.](./images/building-embedding-vizs/low_quality_music_galaxy_embedding.png)

And here's one that's much better:

![A screenshot of a 3D embedding visualization created while building the Music Galaxy project.  It shows a complex web of blue-colored spheres and with lots of variations in density and structure.  There are some small, dense cores with lots of fronds and lobes reaching outwards.](./images/building-embedding-vizs/high_quality_music_galaxy_embedding.png)

Just look at all that _topology_!  There are bulbs, fronds, lobes, clusters — so much cool stuff to look at.

Besides visual appeal, I've also found that embeddings that look like this tend to more accurately reflect the source data as well.

If you're not sure at this point whether things worked well, remember that this is just a crude projection for eyeballing your result.  That being said, in my experience it's usually pretty obvious when something failed badly.  And there's a much better method available for digging into the generated embedding which I'll introduce next.

 - PyMDE (vs. ggvec or others)
 - Performance implications
   - Using random initialization for the thing (figure out exactly which thing) instead of quadratic
   - I tried to use GPU accelerated quadratic initialization with limited success
 - More of an art than a science
 - In my experience, it's usually pretty obvious when things aren't working well
   - Examining the nearest neighbors or some well-known entities and sanity checking can go a long way

## Projecting Down to 2D

So at this point, we have a N-dimensional embedding produced by PyMDE for our entities.  That means that each entity has been assigned its own N-dimensional coordinate.  Now, we have to project that embedding down to 2D so it can be easily visualized.

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

### Algorithms

TODO

## Building the Visualization UI

 - Joining embedding coordinates with entity metadata
 - Static web UI
 - WebGL + Pixi.JS
   - Highly recommend Pixi.JS for building high-performance UIs with a nice high-level wrapper
   - Raw (or close to raw) WebGL isn't as bad as you might think if your visualizations are relatively simple like mine.  The whole thing can be rendered with a single draw call (Pixi can prob. do this too) and a single vert + frag shader
 - Dealing with high-degree nodes when rendering (partial log scale for point size)

## Conclusion
