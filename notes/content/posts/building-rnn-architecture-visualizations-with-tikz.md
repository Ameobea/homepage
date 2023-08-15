+++
title = "Building RNN Architecture Visualizations With TikZ"
date = "2023-08-15T00:42:47-07:00"
+++

I recently finished [a big blog post](https://cprimozic.net/blog/growing-sparse-computational-graphs-with-rnns/) about growing sparse computational graphs with RNNs.

An important part of that work involved creating a custom RNN architecture to facilitate the growth of extremely sparse networks.  To help explain that custom RNN architecture in the blog post, I created some visualizations that looked like this:

<img src="https://i.ameo.link/bb2.svg" style="width: 100%; filter: invert(0.9); background-color: #fff; margin-top: 30px; margin-bottom: 30px" alt="TikZ-generated visualization of the custom RNN architecture I developed for this project.  Shows a single cell of the custom RNN.  Internally, there are nodes for things like kernels and biases, operations like dot product, add, custom activation function A, and nodes between them indicating the flow of data through the network." />

These images are SVGs, so they scale infinitely without getting pixelated or blurry.  I looked into a few different options for generating these including tools like draw.io, manually drawing them in a vector editor like Inkscape, and Graphviz.

It seems that most of the really good-looking RNN visualizations I've seen in popular blog posts were created by hand in Inkscape, but I really wanted to avoid doing that if I could.  I got some _decent_ results when I tried using Graphviz, but I struggled to get some of the fine-grained styling and layout controls that I wanted.

## TikZ

The tool/language I ended up using to build my visualizations is called **TikZ**.  **TikZ** is a sort of programming language and toolkit for programmatically generating vector graphics.  It's a sort of extension to LaTeX, so it's commonly used for creating graphics and visualizations for research papers.

To create a standalone SVG using TikZ, it starts by writing some LaTeX code in a .tex file.  Here's the start of the code for the visualization above :

```tex
\documentclass[tikz,border=3mm]{standalone}
\usetikzlibrary{positioning, shapes, fit}

\begin{document}
\begin{tikzpicture}[
    every node/.style={draw, thick},
    operation/.style={circle, inner sep=2pt},
    kernel/.style={rectangle, fill=gray!20},
    point/.style={coordinate},
    cell/.style={rectangle, draw, thick, dashed, inner sep=2mm, fit=#1}
]
```

This sets up the LaTeX document, imports TikZ + some other helper libraries, defines some global default styling for the graph.  `kernel`, `point`, `cell`, etc. are sort of like CSS classes and can be used to apply styles to elements without having to copy-paste them for each one.

For my purposes, everything else I needed to visualize was either a node or an edge.  When creating nodes in TikZ, you can specify their positions relative to other objects in the graphic like this:

```tex
\node[kernel] (c0_kernel) {Kernel};
\node[operation, below=5mm of c0_kernel] (c0_dot1) {·};
\node[operation, right=15mm of c0_dot1, scale=0.73] (c0_add1) {+};
\node[kernel, above=5mm of c0_add1] (c0_bias) {Bias};
\node[operation, right=8mm of c0_add1, fill=blue!20] (c0_activation1) {$A$};
```

This creates 5 nodes and positions them all relative to each other, except the `c0_kernel`.

Edges are created like this:

```tex
\draw[->] (c0_recur_kernel) -- (c0_dot2) -- (c0_add2) -- (c0_activation2);
\draw[->] (c0_recur_bias) -- (c0_add2);
\draw[-, dashed, draw=blue!90] (c0_new_state) -- (c0_new_state_bridge);
\draw[->, dashed, draw=blue!90] (c0_new_state_bridge) -- (c0_state);
```

As you can see, it's possible to choose whether to use arrows or lines to join nodes and set styles on individual edges.  It's also possible to define multiple edges on the same line, similar to Graphviz.

However, for some of the edges my visualization, I wanted to manually control the routing of edges in order to make it look better.  There are a few different ways to accomplish this in TikZ, but the method I chose was to define `coordinate`s.

In TikZ, `coordinate`s are invisible objects that are not displayed in any way but can instead be used as sources/destinations for edges.  So, to create an angled edge like the one from `New State` to `State` in the visualization, I did this:

```tex
% Define new state and state nodes
\node[kernel, left=3mm of c0_state_bridge] (c0_state) {State};
\node[kernel, below=5mm of c0_activation2] (c0_new_state) {New State};

% Define coordinate at the bend of the edge
\coordinate[left=49.4mm of c0_new_state] (c0_new_state_bridge) {};

% Draw the edge between New State and State in two parts
\draw[-, dashed, draw=blue!90] (c0_new_state) -- (c0_new_state_bridge);
\draw[->, dashed, draw=blue!90] (c0_new_state_bridge) -- (c0_state);
```

The final touch I did to create the visualization was draw the dashed bounding box around the whole cell:

```tex
\node[cell=(c0_kernel)(c0_state)(c0_new_state), label=above:Cell 0] {};
```

I followed a pretty similar process for the other RNN visualization in the blog post.

By using this method, it's possible to have fine-grained control of the visualization's layout and the rendering of all of its components.  There also seem to be a pretty selection of resources available for TikZ which helped out a lot.  It definitely looks _way_ better than the graphviz version I had before.  It did take a good amount of time tweaking the node positions to be just right, but certainly worth it for the result.
