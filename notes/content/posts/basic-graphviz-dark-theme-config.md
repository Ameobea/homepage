+++
title = "A Basic Graphviz Dark Theme Config"
date = "2024-06-20T16:14:03-07:00"
+++

I regularly use Graphviz to generate... graph visualizations.  Since my website and blog are all dark-themed, I usually want to set it up so that the generated SVG is dark-themed as well.

Here's the basic config I use to make graphviz produce outputs with dark backgrounds and light content:

```dot
digraph G {
  bgcolor="#181818";

  node [
    fontcolor = "#e6e6e6",
    style = filled,
    color = "#e6e6e6",
    fillcolor = "#333333"
  ]

  edge [
    color = "#e6e6e6",
    fontcolor = "#e6e6e6"
  ]

  # The rest of your code goes here...
  A -> B;
  B -> C;
  C -> A;
}
```

That results in an output that looks like this:

![A simple graphviz-generated directed graph visualization with a dark theme.  There are three nodes pointing to each other in a triangle.  The nodes, text, and edges are white while the background is dark.](https://i.ameo.link/c9k.svg)

You can of course tweak the hex color to your liking.  There may be some fancy elements you can add that this doesn't cover, but it should be all you need for most cases.
